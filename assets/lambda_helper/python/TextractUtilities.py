import traceback
import pandas as pd
import json
import boto3

# Class to Cluster Textract's Bounding Boxes and Cluster them for reading order
class TextractClusterer:
    def __init__(self):
        self.resetClusters()
    
    def resetClusters(self):
        self.clusters = []
        self.clusterId = 0

    def addNewCluster(self, r, clusterId):
        r['clusterId'] = clusterId
        self.clusters.append(r)
        return True
    
    def checkCollision(self, row):
        # Check with each of the existing cluster
        for i in range(len(self.clusters)-1, 0, -1):
            c = self.clusters[i]
            
            # The cluster's bottom is below the current's Top + Height/2
            y_gap = (row.Top + (row.Height/1.5)) - c.Bottom
            
            # Current's left < cluster's right and Current's right > cluster's left
            x_cond = (row.Left < c.Right) and (row.Right > c.Left)
            x_gap = row.Left - c.Right

            # Calculate Tab length
            tab_len = (row.Width / len(row.text)) * 4
        
            if x_cond and x_gap <= tab_len and y_gap > 0:
                self.addNewCluster(row, c.clusterId)
                return True
            
            # TODO: Based on x_gap & y_gap, if large enough, trigger early termination of cluster search
        
        return False
    
    def makeClusterDf(self, c):
        from pandas import DataFrame
        c = DataFrame(c)
        
        ## Assign colors
        colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
        
        # Repeat colors if there are too many clusters
        m = int(round(c.clusterId.max() / len(colors)) + 1)
        colors = colors * m

        color_map = {i:colors[i] for i in range(c.clusterId.max() + 1)}
        c['COLOR'] = c.clusterId
        c.COLOR.replace(color_map, inplace=True)

        return c        
    
    def identifyClusters(self, df):
        self.resetClusters()
        
        for r in df.iterrows():
            # Ignore index
            r = r[1]

            if len(self.clusters) == 0:
                self.addNewCluster(r, self.clusterId)
                self.clusterId += 1
                continue        
            else:
                if not self.checkCollision(r):
                    self.addNewCluster(r, self.clusterId)
                    self.clusterId += 1
        
        return self.makeClusterDf(self.clusters)


# Class to read Textract's results and 
class TextractResultsReader:
    def __init__(self):
        self.pages = {}
        self.texts = {}
        self.child_to_page = {}
        
    def readS3File(self, bucketName, objectName):
        import boto3
        s3 = boto3.resource('s3')
        obj = s3.Object(bucketName, objectName)
        body = obj.get()['Body'].read().decode("utf-8") 

        return body

    def processResponseBlocks(self, blocks):
        for b in blocks:
            if b['BlockType'] == 'PAGE':
                self.pages[b['Page']] = {
                    'ID':b['Id'],
                    'CHILDS': b['Relationships'][0]['Ids'] if 'Relationships' in b else [],
                    'PAGENO': b['Page']
                }
                
                if 'Relationships' in b:
                    self.child_to_page.update({i:b['Page'] for i in b['Relationships'][0]['Ids']})

            elif b['BlockType'] == 'LINE':
                self.texts[b['Id']] = {
                    'TEXT': b['Text'],
                    'GEOMETRY': b['Geometry'],
                    'PAGE': self.child_to_page[b['Id']]
                }
                
        return None

    def getPagesAndTexts(self, textractJSON):
        for page in textractJSON:
            self.processResponseBlocks(page['Blocks'])

        return self.pages, self.texts
   
    def getPageDf(self, pageNo):
        from pandas import DataFrame
        if pageNo not in self.pages:
            return False
        
        df = []
        pageChilds = self.pages[pageNo]['CHILDS']
        if (len(pageChilds)<=0):
            return False, None
        
        for cId in pageChilds:
            child = self.texts[cId]
            d = child['GEOMETRY']['BoundingBox']
            d.update({'text': child['TEXT']})
            d.update({'Id': cId})
            df.append(d)
            
        df = DataFrame(df)
        df.Top = 1 - df.Top
        df['Right'] = df.Left + df.Width
        df['Bottom'] = df.Top - df.Height
        
        return True, df.sort_values(['Top', 'Left'], ascending=[False, True]).reset_index(drop = True)

    def drawBoundingBoxes(self, df):

        # Create figure
        fig, axs = plt.subplots(1, 1, figsize=(7, 9))
        
        def drawBox(row):
            x = [row.Left, row.Right, row.Right, row.Left, row.Left]
            y = [row.Top, row.Top, row.Bottom, row.Bottom, row.Top]

            axs.plot(x, y, row.COLOR if 'COLOR' in row else 'red')
            axs.text(x[0], y[0], row.text, fontsize=4)
            
        df.apply(drawBox, axis = 1)

        plt.xlim(0,1)
        plt.ylim(0,1)

        plt.show()

    def prepareDFandCluster(self, pages, texts, jobTag):
        fileTextDf = []

        try:
            for p in pages.keys():
                validPage, pageDf = self.getPageDf(p)

                if validPage:
                    # Clusterer
                    c = TextractClusterer()
                    pageDf = c.identifyClusters(pageDf)

                    pageDf['PAGE'] = p
                    pageDf['FILE'] = jobTag
                    fileTextDf.append(pageDf)

            if len(fileTextDf)>0:
                fileTextDf = pd.concat(fileTextDf)
            else:
                print(f"***** No TEXT Extracted from this File {jobTag} ***** ")
                return None

            return fileTextDf

        except Exception as e:
            print(e)
            print(traceback.format_exc())
            return None
        
    def processJobResults(self, jobId, jobTag):

        print(f"------------Start reading results of Job {jobId} for document {jobTag} ------------")
        client = boto3.client('textract')
        response = client.get_document_text_detection(JobId=jobId)
        
        # pages.append(response)
        self.processResponseBlocks(response['Blocks'])

        nextToken = None
        if('NextToken' in response):
            nextToken = response['NextToken']

        while(nextToken):

            response = client.get_document_text_detection(JobId=jobId, NextToken=nextToken)

            # pages.append(response)
            self.processResponseBlocks(response['Blocks'])

            nextToken = None
            if('NextToken' in response):
                nextToken = response['NextToken']
        
        return self.prepareDFandCluster(self.pages, self.texts, jobTag)

    def processResultsFromFile(self, bucketName, objectName, documentId):
        textractJSON = json.loads(self.readS3File(bucketName, objectName))
        self.getPagesAndTexts(textractJSON)

        return self.prepareDFandCluster(self.pages, self.texts, documentId)
        
    @staticmethod
    def writeToS3File(bucketName, textData, documentKey):
        s3_client = boto3.client("s3")
        
        print(f'Writing to S3: {bucketName}/{documentKey}')
        return s3_client.put_object(Body=textData, Bucket=bucketName, Key=documentKey)
