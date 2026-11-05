import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger("devops.aws")

class AwsService:
    def __init__(self):
        self.region = settings.AWS_REGION
        self.role_arn = settings.AWS_ROLE_ARN
        self.boto_session = None
        self._init_session()

    def _init_session(self):
        try:
            import boto3
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.boto_session = boto3.Session(
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=self.region
                )
            else:
                self.boto_session = boto3.Session(region_name=self.region)
            logger.info("Initialized AWS Boto3 session.")
        except Exception as e:
            logger.warning(f"AWS Boto3 initialization failed: {e}. Running with mock/demo provider.")

    def get_resources(self) -> List[Dict[str, Any]]:
        """Returns fleet AWS infrastructure resources."""
        return [
            {
                "id": "vpc-08291a2bc41",
                "name": "devops-platform-vpc",
                "type": "VPC",
                "region": self.region,
                "status": "active",
                "details": {"cidr": "10.0.0.0/16", "subnets": 4, "igw": "igw-0912bc", "nat_gateways": 2},
                "cost_est_per_mo": 64.0
            },
            {
                "id": "eks-prod-cluster",
                "name": "devops-prod-eks",
                "type": "EKS",
                "region": self.region,
                "status": "active",
                "details": {"version": "1.29", "node_groups": 2, "worker_nodes": 3, "endpoint": "https://78A9C12.gr7.us-east-1.eks.amazonaws.com"},
                "cost_est_per_mo": 73.0
            },
            {
                "id": "ec2-i-09ab12cd34",
                "name": "eks-node-group-worker-1",
                "type": "EC2",
                "region": self.region,
                "status": "active",
                "details": {"instance_type": "t3.xlarge", "state": "running", "private_ip": "10.0.1.24", "ami": "ami-0c7217cdde317cfec"},
                "cost_est_per_mo": 121.5
            },
            {
                "id": "ecr-repo-main",
                "name": "devops-microservices",
                "type": "ECR",
                "region": self.region,
                "status": "active",
                "details": {"repositories": 4, "total_images": 32, "scan_on_push": True, "encryption": "AES256"},
                "cost_est_per_mo": 3.2
            },
            {
                "id": "s3-artifacts-bucket",
                "name": "devops-tf-state-and-artifacts-prod",
                "type": "S3",
                "region": self.region,
                "status": "active",
                "details": {"versioning": "Enabled", "encryption": "aws:kms", "size_gb": 14.8},
                "cost_est_per_mo": 0.35
            },
            {
                "id": "iam-role-github-oidc",
                "name": "GitHubActions-EKS-Deployer-Role",
                "type": "IAM",
                "region": self.region,
                "status": "active",
                "details": {"auth_type": "OIDC Federation (token.actions.githubusercontent.com)", "policies": ["AmazonEC2ContainerRegistryPowerUser", "AmazonEKSClusterPolicy"]}
            },
            {
                "id": "cw-alarms-group",
                "name": "EKS-PodHealth-Alarms",
                "type": "CloudWatch",
                "region": self.region,
                "status": "active",
                "details": {"active_alarms": 1, "monitored_metrics": ["CPUUtilization", "MemoryUtilization", "5xxErrors"]}
            }
        ]

aws_service = AwsService()

