#!/usr/bin/env python3

from aws_cdk import core

from knowledge_analyzer.knowledge_analyzer_stack import KnowledgeAnalyzerStack
from knowledge_analyzer.knowledge_analyzer_iam_stack import KnowledgeAnalyzerIAMStack
from knowledge_analyzer.knowledge_analyzer_update_stack import KnowledgeAnalyzerUpdateStack
from knowledge_analyzer.knowledge_analyzer_vpc_stack import KnowledgeAnalyzerVPCStack
from knowledge_analyzer.knowledge_analyzer_webapp_stack import KnowledgeAnalyzerWebappStack

REGION = "us-east-1"

class KAServiceConstruct(core.Construct):
    def __init__(self, scope, stack_name):
        super().__init__(scope, stack_name)

        iam_stack = KnowledgeAnalyzerIAMStack(app, f"{stack_name}-IAMROLE", env={'region': REGION})
        core.Tags.of(iam_stack).add("StackName", stack_name)

        vpc_stack = KnowledgeAnalyzerVPCStack(app, f"{stack_name}-VPC-AND-NEPTUNE", env={'region': REGION}, imServ=iam_stack.service_role)
        core.Tags.of(vpc_stack).add("StackName", stack_name)

        core_stack = KnowledgeAnalyzerStack(app, f"{stack_name}-CORE", env={'region': REGION}, vpc=vpc_stack.vpc, lambda_sg=vpc_stack.lambda_sg)
        core.Tags.of(core_stack).add("StackName", stack_name)
        
        core_update_stack = KnowledgeAnalyzerUpdateStack(app, f"{stack_name}-UPDATE-CORE", env={'region': REGION}, sqsCfn=core_stack.comprehend_complete_sqs, s3_loc_up=core_stack.s3_loc)
        core.Tags.of(core_update_stack).add("StackName", stack_name)        
        
        webapp_stack = KnowledgeAnalyzerWebappStack(app, f"{stack_name}-WEBAPP", env={'region': REGION}, vpc=vpc_stack.vpc)
        core.Tags.of(webapp_stack).add("StackName", stack_name)

app = core.App()

KAServiceConstruct(app, "HEALTHLAKE-KNOWLEDGE-ANALYZER")

app.synth()
