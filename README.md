
# HealthLake+KnoMa - CDK Stack

## Basic CDK repo setup instructions

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack.
To access the resourced EC2, it is imperative that you have the following Key Pair (link: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#having-ec2-create-your-key-pair):
  `iam_admin`

Create a virtual enviroment in Cloud9. Once the virtualenv is created and activated, you can install the required dependencies.

Check to make sure cdk version is at least 1.92.0
`$ cdk --version`
If not 1.92.0, then run `$ npm install cdk`
```
$ cd knoma_healthlake/
$ virtualenv -p python3 cdkHL
$ source cdkHL/bin/activate 
$ pip install -r requirements.txt
```

At this point you can now synthesize the CloudFormation template for this code.

```
$ cdk synth
```


## Requirements
1. AWS CLI
2. AWS CDK command line utility
3. Python>=3.7 
4. Base AWS S3 bucket where all raw and processed are stored.
5. The EC2 instance created by WEBAPP stack should have following tools installed
  * Python
  * npm

## Usage Instructions
1. Pull this repo (this repo)
2. Install the requirements for cdk stack: `pip install -r requirements.txt`
3. Run `cdk synth && cdk deploy`. `cdk deploy` may give an error if `cdk bootstrap` has never been run on the aws account. In which case, please run `cdk bootstrap` and set it up.
4. Run the following `cdk deploy` commands:
    `cdk deploy HEALTHLAKE-KNOWLEDGE-ANALYZER-IAMROLE`
    `cdk deploy HEALTHLAKE-KNOWLEDGE-ANALYZER-VPC-AND-NEPTUNE`
    `cdk deploy HEALTHLAKE-KNOWLEDGE-ANALYZER-CORE`
      `cdk deploy KNOWLEDGE-ANALYZER-CORE` may give an error if `cdk bootstrap` has never been run on the aws account. 
      In which case, please run `cdk bootstrap` and set it up.
      `cdk bootstrap aws://<<your_aws_account_id>>/us-east-1`
    `cdk deploy HEALTHLAKE-KNOWLEDGE-ANALYZER-UPDATE-CORE`
    `cdk deploy HEALTHLAKE-KNOWLEDGE-ANALYZER-WEBAPP`
Amazon HealthLake setup
1. In AWS Cloud9, after completing above steps, begin the following steps:
  Create the data store
  `aws healthlake create-fhir-datastore --region us-east-1 --datastore-type-version R4 --preload-data-config PreloadDataType="SYNTHEA" --datastore-name "<<your_data_store_name>>"`
  Check status of the data store
  `aws healthlake describe-fhir-datastore --datastore-id "<<your_data_store_id>>" --region us-east-1`
  Export data store to Amazon S3
  `aws healthlake start-fhir-export-job --output-data-config S3Uri="s3://hl-synthea-export-<<your_AWS_account_number>>/export-$(date +"%d-%m-%y")" --datastore-id <<your_data_store_id>> --data-access-role-arn arn:aws:iam::<<your_AWS_account_number>>:role/AmazonHealthLake-Export-us-east-1-HealthKnoMaDataAccessRole`
  Check status of export
  `aws healthlake describe-fhir-export-job --datastore-id <<your_data_store_id>> --job-id <<your_job_id>>`

Amazon SageMaker
1. In the resourced notebook instance, run the notebook `Synthea_explore_and_run-experiment.ipynb`
2. Once all the processing is completed, you should see three folder sets as shown below:
    ```
    ⇒  aws s3 ls s3://hl-synthea-source-<<your_aws_account_id>>/                                      
                               PRE source/
    ⇒  aws s3 ls s3://hl-synthea-source-<<your_aws_account_id>>/stdized-data/                                      
                               PRE neptune_triples/
    ```
Amazon Kendra
1. In AWS Cloud9, run the following command to synchronize the patient notes in S3 to Amazon Kendra. 
  `aws kendra start-data-source-sync-job --id <<data_source_id_2nd_circle>> --index-id <<index_id_1st_circle>>`
2. The sync status will begin and can be verified that it is finished by running the following command.
  `aws kendra describe-data-source --id <<data_source_id_2nd_circle>> --index-id <<index_id_1st_circle>>`

Amazon EC2

1. After ssh into EC2, run the following commands:
  `sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 3000`
   Then run the following to trigger the upload to Amazon Neptune as per below:
    ```
    curl -X POST \
        -H 'Content-Type: application/json' \
        https://<<NEPTUNE_CLUSTER_ENDPOINT>>:8182/loader -d '
    {
        "source": "s3://<<S3_BUCKET>>/stdized-data/neptune_triples/nquads/",
        "format": "nquads",
        "iamRoleArn": "<<NEWLY_CREATED_IAM_ROLE_ARN>>",
        "region": "us-east-1",
        "failOnError": "TRUE"
    }'
    ```
    ```
    curl -X POST \
        -H 'Content-Type: application/json' \
        https://healthlake-knowledge-analyzer-vpc-and-neptune-neptunedbcluster.cluster-xxxxxxxxxxxx.us-east-1.neptune.amazonaws.com:8182/loader -d '
    {
        "source": "s3://hl-synthea-source-xxxxxxxxxxxx/stdized-data/neptune_triples/nquads/",
        "format": "nquads",
        "iamRoleArn": "arn:aws:iam::xxxxxxxxxxxx:role/HEALTHLAKE-KNOWLEDGE-ANALYZER-IAMROLE-ServiceRole",
        "region": "us-east-1",
        "failOnError": "TRUE"
    }'
    ```
2. Once the Neptune load is complete and Kendra index + data source creation is complete, follow following steps to deploy the web application on the EC2 instance
  * Create a folder called 'dev' in EC2 and copy/paste the folders 'ka-server-webapp' and 'ka-webapp' into the 'dev' folder in EC2
  * Go to https://docs.conda.io/en/latest/miniconda.html and paste the link for the linux version Python 3.8	Miniconda3
  * `chmod +x` the downloaded Miniconda file and install Miniconda into the EC2 instance
  * Go to https://github.com/nvm-sh/nvm and copy paste the following curl command to install nvm:
      `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash`
  * Type in `source .bashrc`
  * Type in `nvm install 15.10.0`
  * Create the following screen:
      * `screen -S front`
      * Change to the following folder: `cd ~/dev/ka-webapp`
      * Type in `npm install`
      * update the file `.env.development`
      * run `npm start`
  * Detach the current screen and create a second screen for the backend:
      * `screen -S back`
      * In `ka-server-webapp/main.py`, modify neptune endpoint, kendra index, and s3 bucket accordingly.
      * Under `ka-server-webapp`, run `pip install -r requirements`
      * In the same directory, run the following commands:
          `chmod +x run.sh`
      * run `./run.sh`
  * Detach the current screen  
  Go to the public ipv4 address to access the webapp


## Clean up in AWS Cloud9
`cdk destroy HEALTHLAKE-KNOWLEDGE-ANALYZER-UPDATE-CORE`
`cdk destroy HEALTHLAKE-KNOWLEDGE-ANALYZER-WEBAPP`
`cdk destroy HEALTHLAKE-KNOWLEDGE-ANALYZER-CORE`
    Note that during the above step in progress, it will take some time to delete the AWS::Kendra::DataSource that was created.
`cdk destroy HEALTHLAKE-KNOWLEDGE-ANALYZER-VPC-AND-NEPTUNE`
`cdk destroy HEALTHLAKE-KNOWLEDGE-ANALYZER-IAMROLE`
`aws healthlake delete-fhir-datastore --datastore-id <<your_data_store_id>>`
    To verify it’s been deleted, check out the status by running the following command:  
    `aws healthlake describe-fhir-datastore --datastore-id "<<your_data_store_id>>" --region us-east-1`

-----
# Troubleshooting

<details>
<summary>...</summary> 

  ## Neptune troubleshooting and debugging 
  <details>
    <summary>...</summary> 
  For all commands below, please ensure the cluster endpoing URL is correct.

  * For Checking load status you may use:
    ```
    curl -G -k 'https://<<NEPTUNE_CLUSTER_ENDPOINT>>:8182/loader/?loadId=<<LOAD_ID>>&errors=TRUE'
    ```

  * For troubleshooting, connectivity you can use below command:
    ```
    curl -G 'https://<<NEPTUNE_CLUSTER_ENDPOINT>>:8182/status'
    ```

  * To query the KG:
    ```
    curl -X POST https://<<NEPTUNE_CLUSTER_ENDPOINT>>:8182/sparql -H "Accept: text/csv" -H  "Content-type: application/x-www-form-urlencoded"  --data "query=SELECT * WHERE {?s ?p ?o} LIMIT 5"
    ```
    
  * To delete the KG:
    ```
    curl -X POST https://<<NEPTUNE_CLUSTER_ENDPOINT>>:8182/sparql -H "Accept: text/csv" -H  "Content-type: application/x-www-form-urlencoded"  --data "update=drop all"
    ```
  </details>

</details>

-----


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

