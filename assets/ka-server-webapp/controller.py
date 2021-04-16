# controller.py
from endpoints import Endpoints
from hashlib import md5

import sys
import os
import json
import boto3
from urllib.error import HTTPError
import urllib.request
import pandas as pd
from random import choice as random_choice



# *****************************************************************************
# ******** Functions to fetch Kendra Results ********
# *****************************************************************************
def processTextHighlightTags(r):
    if r:
        text = r['Text']
        
        if "Highlights" not in r:
            return r['Text']
        
        tags = r['Highlights']
        tags.sort(key = lambda x: x['BeginOffset'])

        p = 0
        for i in tags:
            text = text[ :i['BeginOffset']+p ] + "<b>" + text[ i['BeginOffset']+p:i['EndOffset']+p ] + "</b>" + text[ i['EndOffset']+p: ]
            p += 7       ### 7 characters introduced "<b></b>"
            
        ## Clean up text
        text = ' '.join(text.split())            
        # display(HTML(text))        
        return text
    
    return None

def prepareKendraResults(kendra_results, BUCKET_NAME):
    kendraResults = {}
    kendraResults["TotalNumberOfResults"] = kendra_results["TotalNumberOfResults"]
    kendraResults["QueryId"] = kendra_results["QueryId"]

    kendraResultItems = []
    for rs in kendra_results["ResultItems"]:
        sr = {}
        sr["Id"] = rs["Id"]
        sr["DocumentId"] = rs["DocumentId"]
        sr["DocumentTitle"] = rs["DocumentTitle"]["Text"] #processTextHighlightTags(rs["DocumentTitle"])
        sr["DocumentURI"] = rs["DocumentURI"]
        sr["Type"] = rs["Type"]
        sr["AnswerText"] = None if not rs["AdditionalAttributes"] else rs["AdditionalAttributes"][0]["Value"]["TextWithHighlightsValue"]
        sr["DocumentExcerpt"] = rs["DocumentExcerpt"]

        kendraResultItems.append(sr)

    kendraResultItems = pd.DataFrame(kendraResultItems)
    
    # Prepare Answer Text & Document Excerpt    
    kendraResultItems["AnswerText"] = kendraResultItems.AnswerText.apply(processTextHighlightTags)
    kendraResultItems["DocumentExcerpt"] = kendraResultItems.DocumentExcerpt.apply(processTextHighlightTags)
    kendraResultItems.loc[kendraResultItems.Type=='ANSWER','DocumentExcerpt'] = kendraResultItems.loc[kendraResultItems.Type=='ANSWER','AnswerText']

    # Final DataFrame
    kendraResultItems = kendraResultItems[["Id", "Type", "DocumentURI", "DocumentExcerpt", "DocumentTitle", "DocumentId"]]
    kendraResultItems["DocumentName"] = kendraResultItems.DocumentId.apply(lambda x: x.replace(f"s3://{BUCKET_NAME}/", ""))
    
    kendraResults["ResultItems"] = list(kendraResultItems.T.to_dict().values())
    return kendraResults


# *****************************************************************************
# ******** Neptune ********
# *****************************************************************************

def fetchDocNode(res):
    palette = {
        'anatomy':'#8dd3c7',
        'medical_condition':'#e31a1c',
        'medication':'#bebada',
        'protected_health_information':'#fb8072',
        'test_treatment_procedure':'#80b1d3',
        'time_expression':'#fdb462',
        'system_organ_site':'#b3de69',
        'dx_name':'#fccde5',
        'acuity':'#bc80bd',
        'direction':'#d9d9d9',
        'diagnosis':'#ccebc5',
        'negation':'#ffed6f',
        'sign':'a6cee3',
        'symptom':'#1f78b4',
        'brand_name':'#b2df8a',
        'generic_name':'#33a02c',
        'dosage':'#fb9a99',
        'duration':'#ffffb3',
        'form':'#fdbf6f',
        'frequency':'#fdbf6f', 
        'rate':'#fdbf6f',       
        'route_or_mode':'#fdbf6f',
        'strength':'#fdbf6f',     
        'address':'#fdbf6f',     
        'age':'#fdbf6f',     
        'email':'#fdbf6f',     
        'id':'#fdbf6f',     
        'name':'#fdbf6f',     
        'phone_or_fax':'#fdbf6f',     
        'profession':'#fdbf6f', 
        'procedure_name':'#fdbf6f', 
        'test_name':'#fdbf6f', 
        'treatment_name':'#fdbf6f', 
        'test_value':'#fdbf6f', 
        'test_units':'#fdbf6f',   
        'time_to_medication_name':'#fdbf6f',   
        'time_to_dx_name':'#fdbf6f',   
        'time_to_test_name':'#fdbf6f',   
        'time_to_procedure_name':'#fdbf6f',   
        'time_to_treatment_name':'#fdbf6f',
        'date':'#fdbf6f',
        'url':'#fdbf6f',
        'contact_point':'#fdbf6f',
        'identifier':'#fdbf6f',
        'quality':'#fdbf6f',
        'quantity':'#fdbf6f',
        'rxnorm':'#fdbf6f',
        'icd10code':'#fdbf6f',
        'icd10description':'#fdbf6f',
        'icd10text':'#fdbf6f',
        'generic_name':'#fdbf6f',
        'rxnormcode':'#fdbf6f',
        'rxnormdescription':'#fdbf6f',
        'icd10text':'#fdbf6f',                          
    }

    entType = res["ent_type"]["value"].replace("http://example.org/entity-type/", "")
    kendraDocumentName = os.path.splitext(res["doc_name"]["value"].replace("source/pdfs/", ""))[0]

    ent_icon = {
        "anatomy": { "text": "fa fa-building", "color": palette[entType] },
        "medical_condition": { "text": "fa fa-calendar", "color": palette[entType] },
        "medication": { "text": "fa fa-usd", "color": palette[entType] },
        "protected_health_information": { "text": "fa fa-bookmark", "color": palette[entType] },
        "test_treatment_procedure": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "time_expression": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "system_organ_site": { "text": "fa fa-user", "color": palette[entType] },
        "dx_name": { "text": "fa fa-balance-scale", "color": palette[entType] },
        "acuity": { "text": "fa fa-comments", "color": palette[entType] },
        "direction": { "text": "fa fa-building", "color": palette[entType] },
        "diagnosis": { "text": "fa fa-calendar", "color": palette[entType] },
        "negation": { "text": "fa fa-usd", "color": palette[entType] },
        "sign": { "text": "fa fa-bookmark", "color": palette[entType] },
        "symptom": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "brand_name": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "generic_name": { "text": "fa fa-user", "color": palette[entType] },
        "dosage": { "text": "fa fa-balance-scale", "color": palette[entType] },
        "duration": { "text": "fa fa-comments", "color": palette[entType] },
        "form": { "text": "fa fa-building", "color": palette[entType] },
        "frequency": { "text": "fa fa-calendar", "color": palette[entType] },
        "rate": { "text": "fa fa-usd", "color": palette[entType] },
        "route_or_mode": { "text": "fa fa-bookmark", "color": palette[entType] },
        "strength": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "address": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "age": { "text": "fa fa-user", "color": palette[entType] },
        "email": { "text": "fa fa-balance-scale", "color": palette[entType] },
        "id": { "text": "fa fa-comments", "color": palette[entType] },
        "name": { "text": "fa fa-building", "color": palette[entType] },
        "phone_or_fax": { "text": "fa fa-calendar", "color": palette[entType] },
        "profession": { "text": "fa fa-usd", "color": palette[entType] },
        "procedure_name": { "text": "fa fa-bookmark", "color": palette[entType] },
        "test_name": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "treatment_name": { "text": "fas fa-map-marker-alt", "color": palette[entType] },
        "test_value": { "text": "fa fa-user", "color": palette[entType] },
        "test_units": { "text": "fa fa-balance-scale", "color": palette[entType] },
        "time_to_medication_name": { "text": "fa fa-comments", "color": palette[entType] },
        "time_to_dx_name": { "text": "fa fa-building", "color": palette[entType] },
        "time_to_test_name": { "text": "fa fa-calendar", "color": palette[entType] },
        "time_to_procedure_name": { "text": "fa fa-usd", "color": palette[entType] },
        "time_to_treatment_name": { "text": "fa fa-bookmark", "color": palette[entType] },
        "date": { "text": "fa fa-bookmark", "color": palette[entType] },
        "url": { "text": "fa fa-bookmark", "color": palette[entType] },
        "contact_point": { "text": "fa fa-bookmark", "color": palette[entType] },
        "identifier": { "text": "fa fa-bookmark", "color": palette[entType] },
        "quality": { "text": "fa fa-bookmark", "color": palette[entType] },
        "quantity": { "text": "fa fa-bookmark", "color": palette[entType] },
        "icd10description": { "text": "fa fa-bookmark", "color": palette[entType] },
        "icd10text": { "text": "fa fa-bookmark", "color": palette[entType] },
        "icd10code": { "text": "fa fa-bookmark", "color": palette[entType] },
        "generic_name": { "text": "fa fa-bookmark", "color": palette[entType] },
        "rxnormcode": { "text": "fa fa-bookmark", "color": palette[entType] },
        "rxnormdescription": { "text": "fa fa-bookmark", "color": palette[entType] },
        "rxnorm": { "text": "fa fa-bookmark", "color": palette[entType] },
    }
    
    ent_id = md5(str(res["ent_name"]["value"]).encode()).hexdigest()
    combos = md5(entType.encode()).hexdigest()
    edge = md5(ent_id.encode()).hexdigest()
    return {
        res["doc_id"]["value"]: {
            "id": res["doc_id"]["value"],
            "shape": 'HexagonNode',
            "data":{"id": res["doc_id"]["value"],
                    "label": kendraDocumentName
                    },
            "label": kendraDocumentName
        },
        ent_id: {
            "id": ent_id,
            "shape": 'CircleNode',
            "data":{"id": ent_id,
                    "label": res["ent_name"]["value"]
                    },
            "label": res["ent_name"]["value"],
            "comboId": entType
        },
        combos: {
            "id": entType,
            "label": entType,
            "collapsed": True
        },
        edge: {
            "data": {"label": ''},
            "source": res["doc_id"]["value"],
            "target": ent_id,
            "properties": []
        }
    }

def getEndpoint(neptune_endpoint):
    session = boto3.session.Session()
    credentials = session.get_credentials()

    endpoints = Endpoints(credentials=credentials, 
                          neptune_endpoint=neptune_endpoint,
                          neptune_port = 8182,
                          region_name = "us-east-1")
    sparqlEndpoint = endpoints.sparql_endpoint()
    return sparqlEndpoint

def cleanupNameSpace(s):
    return s.replace("http://example.org/resource/", "")
    
def npQuery(s, endpoint):
    s = s.replace("\n", "")
    query = f"query={s}"

    ep = getEndpoint(endpoint)
    request_parameters = ep.prepare_request('POST', payload = query)
    req = urllib.request.Request(request_parameters.uri, data=query.encode("utf8"), headers=request_parameters.headers)

    try:
        response = urllib.request.urlopen(req)
        response = response.read().decode('utf8')

        print("*******************************")
        print("Search Result: ",response[:200])
        print("*******************************")
                
        res = json.loads(cleanupNameSpace(response))
        res["success"] = 1
        return res
    except HTTPError as e:
        exc_info = sys.exc_info()
        if e.code == 500:
            print(f"*** SERVER ERROR ***: {json.loads(e.read().decode('utf8'))}")
            return {"success": 0}
            # raise Exception(json.loads(e.read().decode('utf8'))) from None
        else:
            print(f"*** ERROR ***: {exc_info[0].with_traceback(exc_info[1], exc_info[2])}")
            return {"success": 0}   
            # raise exc_info[0].with_traceback(exc_info[1], exc_info[2])