from aws_cdk import core, aws_ec2
from aws_cdk.aws_neptune import (
  CfnDBCluster,
  CfnDBSubnetGroup,
  CfnDBInstance,
  CfnDBParameterGroup,
  CfnDBClusterParameterGroup
)

class KnowledgeAnalyzerVPCStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, imServ, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # *************************************
        # Create VPC
        # *************************************
        self.vpc = aws_ec2.Vpc(self, f"{id}", max_azs=2, cidr="10.42.0.0/22")
        core.Tags.of(self.vpc).add("Name", f"{id}-vpc")

        # Add S3 endpoint to VPC
        self.vpc.add_gateway_endpoint('S3Endpoint', service = aws_ec2.GatewayVpcEndpointAwsService.S3)

        # *************************************
        # Create lambda security group
        # *************************************
        self.lambda_sg = aws_ec2.SecurityGroup(
            self, f"{id}-lambda-sg", vpc=self.vpc, allow_all_outbound=True,
        )
        # # Add an inbound rule to the security group for SSH access to jumpbox
        # self.lambda_sg.add_ingress_rule(
        #     peer=aws_ec2.Peer.any_ipv4(), 
        #     connection=aws_ec2.Port.all_traffic(),
        #     )
        
        

        # *************************************
        # Create Neptune cluster
        # *************************************
        subnetIds = list(map(lambda x: x.subnet_id, self.vpc.private_subnets))

        subnet_grp = CfnDBSubnetGroup(self, f"{id}-NeptuneDBSubnetGroup",
            # db_subnet_group_name = f"{id}-NeptuneDBSubnetGroup",
            db_subnet_group_description = "vpc subnets for neptune cluster for KA stack",
            subnet_ids = subnetIds
        )

        dbcpg = CfnDBClusterParameterGroup(self, f"{id}-NeptuneDBClusterParameterGroup",
            family = "neptune1",
            description = "Cluster parameter group for KA stack",
            parameters = { 'neptune_enable_audit_log': 1, 'neptune_lab_mode': 1 }
        )
        
        self.sg_nep = aws_ec2.SecurityGroup(
            self, 'SecurityGroup',
            vpc=self.vpc,
        )        

        dbCluster = CfnDBCluster(self, f"{id}-NeptuneDBCluster",
            db_subnet_group_name = subnet_grp.db_subnet_group_name,
            # db_cluster_parameter_group_name = dbcpg.db_cluster_parameter_group_name,
            vpc_security_group_ids=[self.sg_nep.security_group_id],
            db_cluster_identifier = f"{id}-NeptuneDBCluster",
            associated_roles=[
                {
                    'roleArn': imServ.role_arn
                }
            ],            
            iam_auth_enabled = False,
        )
        
        # Add an inbound rule to the security group for SSH access to jumpbox
        self.sg_nep.add_ingress_rule(
            peer=aws_ec2.Peer.any_ipv4(), 
            connection=aws_ec2.Port.all_traffic(),
            )        

        dbCluster.add_override("Properties.DBClusterParameterGroupName", {
            'Ref': dbcpg.logical_id
        })

        dbCluster.add_override("Properties.DBSubnetGroupName", {
            'Ref': subnet_grp.logical_id
        })
        
        # *************************************
        # Create Neptune DB Instance
        # *************************************
        dbpg = CfnDBParameterGroup(self, f"{id}-NeptuneDBParameterGroup",
            family = "neptune1",
            description = "DB parameter group for KA stack",
            parameters = { 'neptune_query_timeout': 200000}
        )

        neptuneDb = CfnDBInstance(self, f"{id}-NeptuneDBInstance",
            db_instance_class = "db.r5.large",
        )

        neptuneDb.add_override("Properties.DBClusterIdentifier", {
            'Ref': dbCluster.logical_id
        })

        neptuneDb.add_override("Properties.DBParameterGroupName", {
            'Ref': dbpg.logical_id
        })
