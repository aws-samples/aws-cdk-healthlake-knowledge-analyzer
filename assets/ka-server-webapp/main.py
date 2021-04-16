# main.py
from flask import Flask, Response, request, send_from_directory
from flask_cors import CORS
from urllib.parse import quote
import json
import optparse
import boto3

import pandas as pd
from collections import ChainMap
import os

# App modules
from controller import prepareKendraResults, npQuery, fetchDocNode


app = Flask(__name__)
CORS(app)


NEPTUNE_ENDPOINT = "healthlake-knowledge-analyzer-vpc-and-neptune-neptunedbcluster.cluster-xxxxxxxxxxxx.us-east-1.neptune.amazonaws.com"
KENDRA_INDEX = "<<your_kendra_index>>"
BUCKET_NAME = "hl-synthea-source-xxxxxxxxxxxx"

# *****************************************************************************
# ******** test ********
# *****************************************************************************
@app.route("/", methods=["GET"])
def get():
    return Response(
        json.dumps({"Output": "Hello World!!!"}),
        mimetype="application/json",
        status=200,
    )


@app.route("/testsparql", methods=["GET"])
def testsparql():
    query = """
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX entity: <http://example.org/entity-type/>
    PREFIX rel: <http://example.org/relationship/>    
    SELECT *
    WHERE
        {
                ?doc_id rdf:type entity:document .
                ?doc_id rdfs:label ?doc_name .
                ?ent_id rel:found-in ?doc_id .
                ?ent_id rel:has-text ?text_id .
                ?text_id rdfs:label ?ent_name .
                ?ent_id rdf:type ?ent_type .           
        }
    LIMIT 5
    """

    res = npQuery(query, NEPTUNE_ENDPOINT)
    df = pd.DataFrame(res["results"]["bindings"])
    for col in df.columns:
        df[col] = df[col].apply(lambda x: x["value"])

    print(df.T)

    return Response(json.dumps(res), mimetype="application/json", status=200)


# *****************************************************************************
# ******** Functions to fetch Kendra Results ********
# *****************************************************************************
@app.route("/api/kendraSearch", methods=["GET"])
def kendraSearch():

    # strToken = json.loads(request.data)['strToken']
    query = request.args.get("query")

    print("QUERY RECEIVED: ", query)

    kendra = boto3.client("kendra", region_name="us-east-1")

    # Todo: Parameterie it
    index_id = KENDRA_INDEX

    response = kendra.query(QueryText=query, IndexId=index_id, PageSize=15)

    res = prepareKendraResults(response, BUCKET_NAME)

    return Response(json.dumps(res), mimetype="application/json", status=200)


# *****************************************************************************
# ******** Functions to fetch Doc Node ********
# *****************************************************************************
@app.route("/api/exploreDoc", methods=["POST"])
def exploreDoc():

    # strToken = json.loads(request.data)['strToken']
    # strToken = request.args.get('strToken')
    strToken = json.loads(request.data)["strToken"]

    print("File names received: ", strToken)

    # strToken = "s3://ka-bucket-kesserlg/source/pdfs/2006-gs-annual-report"
    ## We remove the s3://ka-bucket-kesslerg/ portion
    newStrToken = " || ".join(
        map(
            lambda x: f'contains(?doc_name, "{quote(x.lower().replace(f"s3://{BUCKET_NAME}/", ""))}"@en-US)',
            strToken,
        )
    )

    query = f"""
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX entity: <http://example.org/entity-type/>
        PREFIX rel: <http://example.org/relationship/>
        SELECT distinct ?doc_id ?doc_name ?ent_name ?ent_type
        WHERE 
            {{
                ?doc_id rdf:type entity:document .
                ?doc_id rdfs:label ?doc_name .
                filter (
                    {newStrToken}
                )
                ?ent_id rel:found-in ?doc_id .
                ?ent_id rel:has-text ?text_id .
                ?text_id rdfs:label ?ent_name .
                ?ent_id rdf:type ?ent_type .     
            }}
    """

    print("*******************************")
    print("Search Query: ", query)
    print("*******************************")

    res = npQuery(query, NEPTUNE_ENDPOINT)

    df = pd.DataFrame(res["results"]["bindings"])
    for col in df.columns:
        df[col] = df[col].apply(lambda x: x["value"])

    ent_to_file_map = (
        df.groupby(["ent_name"]).doc_name.apply(lambda x: list(x.unique())).to_dict()
    )
    file_to_ent_map = (
        df.groupby(["doc_name"]).ent_name.apply(lambda x: list(x.unique())).to_dict()
    )

    result = {}
    result["ent_to_file_map"] = ent_to_file_map
    result["file_to_ent_map"] = file_to_ent_map

    res = list(map(fetchDocNode, res["results"]["bindings"]))

    result["graph_viz_data"] = dict(ChainMap(*res))

    return Response(json.dumps(result), mimetype="application/json", status=200)


# *****************************************************************************
# ******** Flask Run ********
# *****************************************************************************
def flaskrun(app, default_host="0.0.0.0", default_port="80"):
    """
    Takes a flask.Flask instance and runs it. Parses
    command-line flags to configure the app.
    """

    # Set up the command-line options
    parser = optparse.OptionParser()
    msg = "Hostname of Flask app [{}]".format(default_host)
    parser.add_option("-H", "--host", help=msg, default=default_host)
    msg = "Port for Flask app [{}]".format(default_port)
    parser.add_option("-P", "--port", help=msg, default=default_port)
    parser.add_option(
        "-d", "--debug", action="store_true", dest="debug", help=optparse.SUPPRESS_HELP
    )

    options, _ = parser.parse_args()

    app.run(debug=options.debug, host=options.host, port=int(options.port))


if __name__ == "__main__":
    flaskrun(app)
