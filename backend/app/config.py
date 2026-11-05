import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CloudOps AI - DevOps Automation Platform"
    PROJECT_ID: str = "DEVOPS-001"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./devops.db")

    # AWS Infrastructure
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    AWS_ROLE_ARN: Optional[str] = os.getenv("AWS_ROLE_ARN", "arn:aws:iam::123456789012:role/GitHubActions-EKS-Deployer-Role")
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_ECR_REGISTRY: str = os.getenv("AWS_ECR_REGISTRY", "123456789012.dkr.ecr.us-east-1.amazonaws.com")
    EKS_CLUSTER_NAME: str = os.getenv("EKS_CLUSTER_NAME", "eks-prod-cluster")

    # Gemini AI
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # DevOps Local / Cluster Environments
    KUBECONFIG_PATH: Optional[str] = os.getenv("KUBECONFIG", None)
    USE_MINIKUBE: bool = os.getenv("USE_MINIKUBE", "false").lower() == "true"
    DEMO_MODE_DEFAULT: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

settings = Settings()
