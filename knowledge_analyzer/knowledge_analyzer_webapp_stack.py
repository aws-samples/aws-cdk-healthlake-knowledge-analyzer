from aws_cdk import (
    core,
    aws_certificatemanager as cm,
    aws_ssm as ssm,
    aws_s3 as s3,
    aws_ec2 as ec2,
    aws_iam as iam
)
import urllib.request


KEY_PAIR_NAME = "iam_admin"
EC2_INSTANCE_TYPE = "t2.xlarge"

external_ip = urllib.request.urlopen("https://ident.me").read().decode("utf8")

class KnowledgeAnalyzerWebappStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.Vpc, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # security group
        self.webapp_ec2_security_grp = ec2.SecurityGroup(
            self,
            "healthlake_webapp_ec2_security_grp",
            vpc=vpc,
            description="security group ec2 hosting ec2",
            allow_all_outbound=True,
        )

        code_server_role = iam.Role(
            self, "CodeServerRole",
            assumed_by=iam.CompositePrincipal(
                iam.ServicePrincipal("ec2.amazonaws.com")
            ),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess")
            ]
        )        

        # Open port 22, 80, and 443
        self.webapp_ec2_security_grp.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(22), "ssh"
            )
        self.webapp_ec2_security_grp.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(80), "http"
        )
        self.webapp_ec2_security_grp.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "https",
        ) 

        core.Tags.of(self.webapp_ec2_security_grp).add("Name", "webapp_ec2_security_grp")

        ## EC2 instance to host the webapp
        self.webAppInstance = ec2.Instance(
            self,
            "healthlake-knowledge-webapp-ec2",
            instance_type=ec2.InstanceType(EC2_INSTANCE_TYPE),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            role = code_server_role,
            vpc=vpc,
            vpc_subnets={"subnet_type": ec2.SubnetType.PUBLIC},
            key_name=KEY_PAIR_NAME,
            security_group=self.webapp_ec2_security_grp
        )
