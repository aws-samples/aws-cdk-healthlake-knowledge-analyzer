import json
import traceback
import pandas as pd
import rdflib
import os
import boto3
import uuid
import urllib
from urllib.parse import urlparse
import io
from io import StringIO, BytesIO

from hashlib import md5
from rdflib import URIRef, Literal, ConjunctiveGraph
from rdflib.namespace import RDF, RDFS
from aws_lambda_powertools.utilities.batch import sqs_batch_processor
from botocore.config import Config

config = Config(region_name="us-east-1")

## **************** Neptune NameSpace **************** 
COMP_ENT_GRAPH = "http://example.org/graph/comprehend-entities"
ENTITY_TYPE = "http://example.org/entity-type/{0}"
RESOURCE_NODE = "http://example.org/resource/{0}"

HAS_TEXT = "http://example.org/relationship/has-text"
FOUND_IN = "http://example.org/relationship/found-in"


## **************** Process Entire Dataframe **************** 
def processRequest(df, sourceFile = None):
    df.Text = df.Text.apply(str)
    df.File = df.File.apply(str)
    df.Type = df.Type.apply(str)

    # Clean values
    df = df[df.Score >= 0.70]
    df = df[df.Text.str.len()>1]

    # ************* Standardize the text & Filename *************
    df.Text = df.Text.str.lower()
    df.Text = df.Text.str.replace("'", "")
    df.Text = df.Text.str.replace('"', '')

    df.File = df.File.str.lower()
    df.File = df.File.str.replace("'", "")
    df.File = df.File.str.replace('"', '')

    df.Type = df.Type.str.lower()

    # ************* Occurrence IDs for each comp result *************
    df['OCCURRENCE_NODE_ID'] = df.Text.apply(lambda x: URIRef(RESOURCE_NODE.format(uuid.uuid1())))

    # ************* Node IDs for text tokens *************
    # For each text token in dataframe
    tokens = list(df.Text.unique())
    tokens.extend(list(df.File.unique()))
    

    print(f"Generating nodeIDs for {len(tokens)} Tokens")
    tokenNodeIDs = { 
        t:URIRef(RESOURCE_NODE.format(md5(t.encode()).hexdigest() )) 
        for t in tokens 
        }
    print(f"Completed nodeID generation!!")

    # ************* Create the RDF Triples *************
    g = ConjunctiveGraph(identifier = COMP_ENT_GRAPH)
    def create_comp_triple(row):
        g.add( (tokenNodeIDs[row.Text], RDFS.label, Literal(str(row.Text), lang="en-US")) )     ## NODE_TEXT_X label "JOBH"
        g.add( (tokenNodeIDs[row.File], RDFS.label, Literal(str(row.File), lang="en-US")) )     ## NODE_FILE_X label "abc.pdf"

        g.add( (tokenNodeIDs[row.File], RDF.type, URIRef(ENTITY_TYPE.format('document'))) )     ## NODE_FILE_X type DOCUMENT
        
        g.add( (row.OCCURRENCE_NODE_ID, RDF.type, URIRef(ENTITY_TYPE.format(row.Type))) )       ## OCCURRENCE type PERSON
        g.add( (row.OCCURRENCE_NODE_ID, URIRef(HAS_TEXT), tokenNodeIDs[row.Text]) )       ## OCCURRENCE has_text NODE_TEXT_X
        g.add( (row.OCCURRENCE_NODE_ID, URIRef(FOUND_IN), tokenNodeIDs[row.File]) )       ## OCCURRENCE has_text NODE_TEXT_X

    df.apply(create_comp_triple, axis = 1)
    print(f"Created Triples!!")

    # ************* Write Triples to File *************
    trip_filename  = f"/tmp/{os.path.splitext(sourceFile)[0]}.csv"
    with open(trip_filename, "w") as f:
        f.write(g.serialize(format = 'nquads').decode())
    
    return trip_filename


def record_handler(record):
    
    # print(f"event: {json.dumps(event, indent = 2)}")
    sqs = boto3.client('sqs')

    try:
        print(json.loads(record['body']))
        # print(f"event: {json.dumps(record, indent = 2)}")
        # #  ************* Get S3 info *************
        #1 - Get the bucket name
        s3 = boto3.client('s3')


        message = json.loads(record['body'])
        bucket_name=message['Records'][0]['s3']['bucket']['name']
        key = message['Records'][0]['s3']['object']['key']
        #2 - Fetch the file from S3
        response = s3.get_object(Bucket=bucket_name, Key=key)
        df = pd.read_csv(io.BytesIO(response['Body'].read()))
        

        #  ************* Read Comp Results *************
        print(f"Comprehend results read, size: {df.shape[0]}")

        ## Create Neptune Triples
        
        full_path=key
        trim_path=os.path.relpath(full_path, 'stdized-data/comprehend_results/csv')
        file_name_trunk = trim_path.split(".")[0]
        split_files_name_trunk = file_name_trunk
        document_id = md5(f"source/{split_files_name_trunk}".encode()).hexdigest()
        trip_filename = processRequest(df, sourceFile = split_files_name_trunk)
        s3_trip_filename = f"stdized-data/neptune_triples/nquads/{document_id}/{split_files_name_trunk}.csv"

        #  ************* upload to S3 *************
        s3_client = boto3.client('s3')
        s3_client.upload_file(trip_filename, bucket_name, s3_trip_filename)

        print(f"Neptune Triples Uploaded to S3 at: {s3_trip_filename}")        


    except Exception as e:
        print(f"Error in Function: {str(e)}")
        print(traceback.format_exc())

        return {
            'statusCode': 500,
            'body': f"Error in Function: {str(e)}"
        }

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'text/plain'
        },
        'body': f"Triples have been generated."
    }

@sqs_batch_processor(record_handler=record_handler, config=config)
def lambda_handler(record, context):
    return {"statusCode": 200}