from aws_cdk import (
    core,
    aws_iam,
)

class KnowledgeAnalyzerIAMStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        self.PREFIX = id
        
        ## **************** Create HealthLake Knowledge Analyzer Service Role **************** 
        self.service_role = aws_iam.Role(
            self, f'{self.PREFIX}-ServiceRole',
            assumed_by = aws_iam.CompositePrincipal(
                aws_iam.ServicePrincipal('sns.amazonaws.com'),
                aws_iam.ServicePrincipal('sqs.amazonaws.com'),
                aws_iam.ServicePrincipal('lambda.amazonaws.com'),
                aws_iam.ServicePrincipal('rds.amazonaws.com'),
                aws_iam.ServicePrincipal('healthlake.amazonaws.com'),
                aws_iam.ServicePrincipal('ec2.amazonaws.com'),
                aws_iam.ServicePrincipal('kendra.amazonaws.com'),
                aws_iam.ServicePrincipal('sagemaker.amazonaws.com'),
                ),
            role_name = f"{self.PREFIX}-ServiceRole",
        )

        self.updateServiceRolePermissions()

    def updateServiceRolePermissions(self):
        resource_prefix = "HEALTHLAKE-KNOWLEDGE-ANALYZER"
        ## **************** Service Permissions **************** 
        self.service_role.add_to_policy(aws_iam.PolicyStatement(
            effect = aws_iam.Effect.ALLOW,
            resources = [ 
                f"arn:aws:sqs:us-*:{self.account}:{resource_prefix}*",
                f"arn:aws:sns:us-*:{self.account}:{resource_prefix}*",
                f"arn:aws:logs:us-*:{self.account}:*",
                f"arn:aws:neptune-db:us-*:{self.account}:*",
                f"arn:aws:healthlake:us-*:{self.account}:*",
                f"arn:aws:ec2:us-*:{self.account}:*",
                f"arn:aws:sagemaker:us-*:{self.account}:*",
                "*"
                ],
            actions = [
                "sqs:*",
                "sns:*",
                "logs:*",
                "healthlake:*",
                "iam:PassRole",
                "s3:*",
                "rds:*",
                "neptune-db:*",
                "ec2:*",
                "sagemaker:*",
                ],
            conditions = [],
        ))

        # Healthlake
        self.app_instance_role = aws_iam.Role(
            self,
            "AmazonHealthLake-Export-us-east-1-HealthKnoMaDataAccessRole",
            role_name=f'AmazonHealthLake-Export-us-east-1-HealthKnoMaDataAccessRole',
            assumed_by=aws_iam.ServicePrincipal("healthlake.amazonaws.com")
        )

        roleStmt1=aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                resources=["arn:aws:s3:::*"],
                actions=["s3:PutObject"]
            )
        roleStmt2=aws_iam.PolicyStatement(
                effect=aws_iam.Effect.ALLOW,
                resources=["arn:aws:s3:::*"],
                actions=["s3:ListBucket", "s3:GetBucketPublicAccessBlock", "s3:GetEncryptionConfiguration"]
            )
        
        self.app_instance_role.add_to_policy( roleStmt1 )
        self.app_instance_role.add_to_policy( roleStmt2 )
        
        # self.app_instance_role = aws_iam.CfnRole(
        #     self,
        #     "AmazonHealthLake-Export-us-east-1-HealthDataAccessRole",
        #     role_name=f'AmazonHealthLake-Export-us-east-1-HealthDataAccessRole',
        #     assume_role_policy_document=aws_iam.PolicyDocument(
        #         statements=[
        #             aws_iam.PolicyStatement(
        #                 effect=aws_iam.Effect.ALLOW,
        #                 actions=[ "sts:AssumeRole" ],
        #                 principals=[ aws_iam.ServicePrincipal("healthlake.amazonaws.com") ]
        #             )
        #         ]
        #     ),
        #     policies=[
        #         aws_iam.CfnRole.PolicyProperty(
        #             policy_document=aws_iam.PolicyDocument(
        #                 statements=[
        #                     aws_iam.PolicyStatement(
        #                         effect=aws_iam.Effect.ALLOW,
        #                         actions=[
        #                             "s3:PutObject"
        #                         ],
        #                         resources=["*"]
        #                     )
        #                 ]
        #             ),
        #             policy_name="HelathlakeAllowS3PutObject"
        #         ),
        #         aws_iam.CfnRole.PolicyProperty(
        #             policy_document=aws_iam.PolicyDocument(
        #                 statements=[
        #                     aws_iam.PolicyStatement(
        #                         effect=aws_iam.Effect.ALLOW,
        #                         actions=[
        #                             "s3:ListBucket",
        #                             "s3:GetBucketPublicAccessBlock",
        #                             "s3:GetEncryptionConfiguration"
        #                         ],
        #                         resources=[ "*" ]
        #                     )
        #                 ]
        #             ),
        #             policy_name="HelathlakeAllowS3OListGetBucketAndEncryption"
        #         ),
        #     ],
        # )