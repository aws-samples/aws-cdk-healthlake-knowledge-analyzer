import boto3
from re import sub
import time
from random import randint
from botocore.exceptions import ClientError
import json
from botocore.config import Config
from ratelimit import limits, sleep_and_retry
from backoff import on_exception, expo, full_jitter

FIVE_MINUTES = 300  # Number of seconds in five minutes.
# FIFTEEN_MINUTES = 900  # Number of seconds in fifteen minutes.

config = Config(
    read_timeout=120,
  retries = {
      'max_attempts': 5,
      'mode': 'standard'
  }
)


class ComprehendProcessor:

    def getJobResults(self, jobResults, textList=None):
        resultSet = {"ResultList":[]}
        
        for r in jobResults:
            resultSet["ResultList"].append([r])
                
        return resultSet

    @staticmethod
    def writeToS3File(bucketName, textData, documentKey):
        s3_client = boto3.client("s3")
        
        print(f'Writing to S3: {documentKey}')
        return s3_client.put_object(Body=textData, Bucket=bucketName, Key=documentKey,
                            ServerSideEncryption='aws:kms',
                            SSEKMSKeyId='82697d82-ec4c-4890-b585-9900c1ecb44f')
    
    def readText(self, bucketName, objectName):
        s3 = boto3.resource('s3')
        obj = s3.Object(bucketName, objectName)
        body = obj.get()['Body'].read().decode("utf-8") 
        body = body.replace("\n", " ")

        return body
        
    def createTextChunks(self, longString):
        import spacy
        from spacy.lang.en import English

        # Break into sentences after coref
        nlp = English()
        nlp.add_pipe(nlp.create_pipe("sentencizer"))
        
        # Chunk into sentences
        doc = nlp(longString, disable=['ner'])
        
        # ************* COREF BASE ********************
        # Load your usual SpaCy model (one of SpaCy English models)
        # nlp = spacy.load('en_core_web_sm')

        # Add COREF
        # neuralcoref.add_to_pipe(nlp)

        # Perform parallel COREF for each sentence from above
        # coref_sentences = nlp.pipe([s.text[:4999] for s in doc.sents], disable=['ner'])

        # limiting to 4900 - after testing I find that
        # rows and rows of table data that are not sentences are what that doesn't get chunked
        # Hence forcing a manual chunk - there will be loss of information (TODO)
        #return [s._.coref_resolved[:4999] for s in coref_sentences]
        return [s.text[:4999] for s in doc.sents]
        
    def executeComprehendProcessFromFile(self, bucketName, objectName):
        
        # ******** Read File ******** 
        text = self.readText(bucketName, objectName)

        return self.parseTextandInvokeComprehend(list([text]))
    
    def parseTextandInvokeComprehend(self, texts):
        comprehend = boto3.client("comprehendmedical", config=config)
        # comprehend = boto3.client("comprehendmedical")
        
        def backoff_hdlr(details):
            print ("Backing off {wait:0.1f} seconds afters {tries} tries "
                   "calling function {target} with args {args} and kwargs "
                   "{kwargs}".format(**details))
                   
        
        @sleep_and_retry  # if we exceed the ratelimit imposed by @limits forces sleep until we can start again.
        # @on_exception(expo, ClientError, max_tries=5, max_time=120, jitter=full_jitter, on_backoff=backoff_hdlr)
        @limits(calls=10, period=60)
        def callApi(textList):
            response = comprehend.detect_entities_v2(Text = textList)
            return response
        
        def join_while_too_short(it, length):
            it = iter(it)
            while True:
                current = next(it)
                while len(current) < length:
                    current += ' ' + next(it)
                yield current

        try:
            textList = []
            
            for t in texts:
                textList.extend(self.createTextChunks(t))
                
            temptextList=' '.join(textList)
            
            if len(temptextList.encode("utf8"))>20000:
                newlist = list()
                newitem = ''
                for item in textList:
                    if len(newitem) == 0:
                        newitem = item
                    else:
                        newitem = newitem +" "+ item
                    if len(newitem) > 8500:
                        newlist.append(newitem)
                        newitem=''
                
                if len(newitem)>0: # grab any left over stuff that was at the end
                    newlist.append(newitem)
                    
                textList=newlist
            elif len(temptextList.encode("utf8"))<20000:
                textList=[' '.join(temptextList)]
            
                    
            # ******** Detect Entities & Gather Results ********
            jobResults = []
            # quot_a=0
            for i in range(0, len(textList)):
                jobResults.append(callApi(textList[i]))
            # for i in range(0, len(textList)):
            #     jobResults.append(callApi(textList[i]))
                    

            entityResults = self.getJobResults(jobResults, textList = textList)
            print(entityResults)

            print(f'Results received. Pages involved: {len(entityResults)}.')

            return {
                "success": True, 
                "entities": entityResults,
            }     
         
        except Exception as e:
            print(f"------- Error during Comprehend Processing textLength: {len(texts)} ------- ")
            print("------- ERROR MESSAGE: " + str(e))
            print(f"------- END ERROR MESSAGE ------- ")
            
            return {
                "success": False, 
                'textLength': len(texts),                 
            }
