from constructs import Construct
from aws_cdk import (
    Stack,
    Aws,
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


class KnowledgeAnalyzerUpdateStack(Stack):

    def __init__(
        self, 
        scope: Construct, 
        id: str,
        sqsCfn,
        s3_loc_up,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        self.PREFIX = id

        
        self.sqs_queue = sqs.Queue.from_queue_arn(
            self, "QueuefromCfn",
            f"arn:aws:sqs:{Aws.REGION}:{Aws.ACCOUNT_ID}:{sqsCfn.queue_name}"
        )

        s3_loc_up.add_object_created_notification(aws_s3_notifications.SqsDestination(self.sqs_queue), _s3.NotificationKeyFilter(prefix='stdized-data/comprehend_results/csv/', suffix='.csv'))