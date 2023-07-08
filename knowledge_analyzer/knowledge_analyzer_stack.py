from constructs import Construct
from aws_cdk import (
    Stack,
    Aws,
    RemovalPolicy,
    Duration,
    aws_lambda as _lambda,
    aws_sns as sns,
    aws_sqs as sqs,
    aws_ec2 as ec2,
    aws_lambda_event_sources,
    aws_sns_subscriptions,
    aws_iam,
    aws_s3 as _s3,
    aws_s3_notifications,
    aws_apigateway as apigtw,
    aws_kendra as kendra,
)
import aws_cdk.aws_sagemaker as sagemaker


NEPTUNE_TRIPLES_FOLDER = "stdized-data/neptune_triples/nquads/"
EXECUTE_COMPREHEND_TIMEOUT=900

class KnowledgeAnalyzerStack(Stack):

    def __init__(
        self, 
        scope: Construct, 
        id: str, 
        vpc: ec2.Vpc,
        lambda_sg: ec2.SecurityGroup,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        self.PREFIX = id

        ## **************** Create Knowledge Analyzer Service Role **************** 
        self.service_role = aws_iam.Role.from_role_arn(
            self, f'{self.PREFIX}-IAMROLE-ServiceRole',
            f"arn:aws:iam::{self.account}:role/HLKA-IAMROLE-ServiceRole"
        )

        ## **************** Create a notebook Instance ****************
        self.notebook_instance_role = aws_iam.Role(
            self,
            "AmazonSageMaker-ExecutionRole-20210318",
            role_name=f'AmazonSageMaker-ExecutionRole-20210318',
            assumed_by=aws_iam.ServicePrincipal("sagemaker.amazonaws.com")
        )

        roleStmt1=aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                resources=["arn:aws:s3:::*"],
                actions=["s3:PutObject", "s3:ListObjects", "s3:GetObject"]
            )
        roleStmt2=aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                resources=["arn:aws:s3:::*"],
                actions=["s3:ListBucket", "s3:GetBucketPublicAccessBlock", "s3:GetEncryptionConfiguration"]
            )
        
        self.notebook_instance_role.add_to_policy( roleStmt1 )
        self.notebook_instance_role.add_to_policy( roleStmt2 )
        
        self.notebook_instance_role.add_managed_policy(aws_iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSageMakerFullAccess"))

        
        self.nbInstance = sagemaker.CfnNotebookInstance(
            self,
            f'{self.PREFIX}-HealtLake-Blog-Run',
            instance_type = 'ml.t2.medium',
            notebook_instance_name=f'{self.PREFIX}-HealtLake-Blog-Run',
            role_arn = self.notebook_instance_role.role_arn,
            )


        ## **************** Inherit VPC & Security Group **************** 
        self.vpc = vpc
        self.lambda_sg = lambda_sg


        self.comprehend_complete_sqs = sqs.CfnQueue(
            self, f'{self.PREFIX}-comprehendCompleteQueue',
            visibility_timeout = 900,
            queue_name= f'{self.PREFIX}-comprehendCompleteQueue'
        )
        self.s3export = _s3.Bucket(self, "hl-synthea-export", bucket_name = "hl-synthea-export-%s" % (Aws.ACCOUNT_ID), block_public_access=_s3.BlockPublicAccess.BLOCK_ALL, encryption=_s3.BucketEncryption.S3_MANAGED, removal_policy=RemovalPolicy.DESTROY, auto_delete_objects=True)
        self.s3_loc = _s3.Bucket(self, "hl-synthea-source", bucket_name = "hl-synthea-source-%s" % (Aws.ACCOUNT_ID), block_public_access=_s3.BlockPublicAccess.BLOCK_ALL, removal_policy=RemovalPolicy.DESTROY, auto_delete_objects=True)
            
        self.kendra_instance_role = aws_iam.CfnRole(
            self,
            f'{self.PREFIX}-Kendra-ServiceRole',
            role_name=f'{self.PREFIX}-Kendra-ServiceRole',
            assume_role_policy_document=aws_iam.PolicyDocument(
                statements=[
                    aws_iam.PolicyStatement(
                        effect=aws_iam.Effect.ALLOW,
                        actions=[ "sts:AssumeRole" ],
                        principals=[ aws_iam.ServicePrincipal("kendra.amazonaws.com") ]
                    )
                ]
            ),
            policies=[
                aws_iam.CfnRole.PolicyProperty(
                    policy_document=aws_iam.PolicyDocument(
                        statements=[
                            aws_iam.PolicyStatement(
                                effect=aws_iam.Effect.ALLOW,
                                actions=[
                                    "s3:GetObject",
                                    "s3:ListBucket",
                                    "s3:GetBucketPublicAccessBlock",
                                    "s3:GetEncryptionConfiguration"                                    
                                ],
                                resources=["*"]
                            )
                        ]
                    ),
                    policy_name="KendraAllowS3GetListObject"
                ),
                aws_iam.CfnRole.PolicyProperty(
                    policy_document=aws_iam.PolicyDocument(
                        statements=[
                            aws_iam.PolicyStatement(
                                effect=aws_iam.Effect.ALLOW,
                                actions=[
                                    "cloudwatch:PutMetricData"
                                ],
                                resources=["*"],
                                conditions = {
                                    "StringEquals": {
                                        'cloudwatch:namespace': 'AWS/Kendra',
                                    },                                    
                                }
                            )
                        ]
                    ),
                    policy_name="KendraAllowMetricObject"
                ),                
                aws_iam.CfnRole.PolicyProperty(
                    policy_document=aws_iam.PolicyDocument(
                        statements=[
                            aws_iam.PolicyStatement(
                                effect=aws_iam.Effect.ALLOW,
                                actions=[
                                    'logs:DescribeLogGroups',
                                    'logs:CreateLogGroup',
                                ],
                                resources=[
                                    "arn:" + "aws" + ":logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:" + "/aws/kendra/*"
                                ],
                            )
                        ]
                    ),
                    policy_name="KendraAllowLogObject"
                ),   
                aws_iam.CfnRole.PolicyProperty(
                    policy_document=aws_iam.PolicyDocument(
                        statements=[
                            aws_iam.PolicyStatement(
                                effect=aws_iam.Effect.ALLOW,
                                actions=[
                                    'logs:DescribeLogStreams',
                                    'logs:CreateLogStream',
                                    'logs:PutLogEvents',
                                ],
                                resources=[
                                    "arn:" + "aws" + ":logs:" + Aws.REGION + ":" + Aws.ACCOUNT_ID + ":log-group:" + "/aws/kendra/*:log-stream:*" 
                                ],
                            )
                        ]
                    ),
                    policy_name="KendraAllowLogStreamsObject"
                ), 
            ],
        )   

        self.indexKendra = kendra.CfnIndex(
            self, f'{self.PREFIX}-KendraIndex',
            edition = 'DEVELOPER_EDITION',
            name = f'{self.PREFIX}-HealthLakeNotes',
            role_arn = self.kendra_instance_role.attr_arn,
        )


        #-------- kendra data source role
        self.kendra_data_source_instance_role = aws_iam.Role(
            self,
            f'{self.PREFIX}-KDSrc-ServiceRole', 
            role_name=f'{self.PREFIX}-KDSrc-ServiceRole',
            assumed_by=aws_iam.ServicePrincipal('kendra.amazonaws.com'))
    
        self.kendra_data_source_instance_role.add_to_policy(aws_iam.PolicyStatement(
            effect=aws_iam.Effect.ALLOW,
            actions=[
                'kendra:BatchPutDocument',
                'kendra:BatchDeleteDocument',
                ],
            resources=[self.indexKendra.attr_arn]
        ))
        
        # Grant read access for the S3 bucket to Kendra
        self.s3_loc.grant_read(self.kendra_data_source_instance_role)
        
        # Create the Kendra data source
        self.datasourceKendra = kendra.CfnDataSource(
            self, f'{self.PREFIX}-Data-S3-HealthLake',
            name = f'{self.PREFIX}-Data-S3-HealthLake',
            index_id = self.indexKendra.attr_id,
            type = 'S3',
            data_source_configuration=kendra.CfnDataSource.DataSourceConfigurationProperty(
                s3_configuration=kendra.CfnDataSource.S3DataSourceConfigurationProperty(
                    bucket_name=self.s3_loc.bucket_name,
                    # inclusion_prefixes=kendra.CfnDataSource.DataSourceInclusionsExclusionsStringsProperty(
                    #     data_source_inclusions_exclusions_strings=["source/"]
                    # ),
                )
            ),
            role_arn = self.kendra_data_source_instance_role.role_arn,
        )
        
        self.datasourceKendra.add_override("Properties.DataSourceConfiguration.S3Configuration.InclusionPrefixes", ['source/'])

        ## **************** Create resources **************** 
        self.createLambdaFunctions()
        self.setLambdaTriggers()

        # QueuePolicy
        self.queue_policy = sqs.CfnQueuePolicy(self, "QueuePolicy", 
            queues = [self.comprehend_complete_sqs.ref],
            policy_document = {
                "Version" : "2008-10-17",
                "Id" : "__default_policy_ID",
                "Statement" : [{
                    "Sid" : "__owner_statement",
                    "Effect" : "Allow",
                    "Principal" : {
                        "AWS": "*"
                    },
                    "Action" : "SQS:SendMessage",
                    "Resource" : f'arn:aws:sqs:us-east-1:{Aws.ACCOUNT_ID}:{self.comprehend_complete_sqs.queue_name}', # self.comprehend_complete_sqs.ref
                    "Condition": {
                        "StringEquals": {
                        "aws:SourceAccount": f'{Aws.ACCOUNT_ID}'
                        },
                        "ArnLike": {
                        "aws:SourceArn": f'arn:aws:s3:*:*:{self.s3_loc.bucket_name}'
                        }
                    }
                }]                    
            }
        )
        
    def createLambdaFunctions(self):
        ## **************** Lambda Layers - Helpers **************** 
        self.lambda_helper_base = _lambda.LayerVersion(
            self, f'{self.PREFIX}-lambdaHelperLayer',
            compatible_runtimes = [_lambda.Runtime.PYTHON_3_7],
            code = _lambda.Code.from_asset('./assets/lambda_helper'),
            description = "A Helper layer for supporting code",
            layer_version_name = f"{self.PREFIX}-lambdaHelperLayer",
        )

        self.lambda_helper_neptune = _lambda.LayerVersion(
            self, f'{self.PREFIX}-lambdaHelperNeptune',
            compatible_runtimes = [_lambda.Runtime.PYTHON_3_7],
            code = _lambda.Code.from_asset('./assets/lambda_helper_neptune'),
            description = "A Helper layer for generating neptune triples",
            layer_version_name = f"{self.PREFIX}-lambdaHelperNeptune",
        )

        self.lambda_layer_spacy = _lambda.LayerVersion(
            self, f'{self.PREFIX}-lambdaHelperPandasSpacy',
            compatible_runtimes = [_lambda.Runtime.PYTHON_3_7],
            code = _lambda.Code.from_asset('./assets/lambda_helper_spacy/python.zip'),
            description = "A Helper layer containing spacy, pandas and numpy",
            layer_version_name = f"{self.PREFIX}-lambdaHelperPandasSpacy",
        )

        ## **************** Lambda Function **************** 
        # Function to load triples 
        self.generate_triples_lambda = _lambda.Function(
            self, f'{self.PREFIX}-genTriplesAndLoadNeptune',
            runtime = _lambda.Runtime.PYTHON_3_7,
            code = _lambda.Code.from_asset('./assets/lambda'),
            handler = 'genTriplesAndLoadNeptune.lambda_handler',
            function_name = f'{self.PREFIX}-genTriplesAndLoadNeptune',
            memory_size = 1024,
            # retry_attempts = 1, 
            timeout = Duration.seconds(EXECUTE_COMPREHEND_TIMEOUT),
            environment = { 
                'NEPTUNE_TRIPLES_FOLDER': NEPTUNE_TRIPLES_FOLDER
            },
            role = self.service_role,
            layers = [self.lambda_helper_base, self.lambda_layer_spacy, self.lambda_helper_neptune],
            vpc = self.vpc,
            security_groups = [self.lambda_sg]
        )


    def setLambdaTriggers(self):
        ## **************** Event Sources & Triggers **************** 
        # Read Comprehend completion notification and prepare triples for neptune
        self.sqs_queue = sqs.Queue.from_queue_arn(
            self, "CDKQueue",
            self.comprehend_complete_sqs.get_att("Arn").to_string() #f'arn:aws:sqs:us-east-1:{Aws.ACCOUNT_ID}:{self.comprehend_complete_sqs.queue_name}'
        )        
        self.generate_triples_lambda.add_event_source(aws_lambda_event_sources.SqsEventSource(self.sqs_queue, batch_size = 1))