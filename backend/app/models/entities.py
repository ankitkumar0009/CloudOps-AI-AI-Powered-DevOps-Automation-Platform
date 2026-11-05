from datetime import datetime
import json
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    Enum,
    JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), default="DevOps Engineer")
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    repo_url = Column(String(255), nullable=False)
    branch = Column(String(100), default="main")
    app_type = Column(String(50), default="nodejs") # nodejs, python, java
    port = Column(Integer, default=3000)
    replicas = Column(Integer, default=2)
    cpu_limit = Column(String(50), default="500m")
    memory_limit = Column(String(50), default="512Mi")
    environment = Column(String(50), default="production")
    env_vars = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
    pipelines = relationship("PipelineExecution", back_populates="project", cascade="all, delete-orphan")
    docker_images = relationship("DockerImage", back_populates="project", cascade="all, delete-orphan")

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False)
    version = Column(String(50), nullable=False)
    commit_sha = Column(String(50), nullable=False)
    status = Column(String(50), default="pending") # pending, running, success, failed, rolled_back
    k8s_namespace = Column(String(50), default="production")
    k8s_deployment_name = Column(String(150))
    target_revision = Column(Integer, default=1)
    triggered_by = Column(String(100), default="Automated CI/CD")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(String(50), nullable=True)
    logs = Column(Text, default="")

    project = relationship("Project", back_populates="deployments")
    rollbacks = relationship("RollbackRecord", back_populates="deployment")

class DockerImage(Base):
    __tablename__ = "docker_images"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=True)
    repository = Column(String(150), nullable=False)
    tag = Column(String(100), nullable=False)
    digest = Column(String(255), nullable=True)
    size_mb = Column(Float, default=150.0)
    app_type = Column(String(50), default="nodejs")
    vulnerabilities = Column(JSON, default=lambda: {"critical": 0, "high": 0, "medium": 0, "low": 0})
    pushed_to_ecr = Column(Boolean, default=False)
    ecr_uri = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="docker_images")

class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False)
    branch = Column(String(100), default="main")
    commit_sha = Column(String(50), nullable=False)
    commit_message = Column(String(255), default="Automated commit")
    status = Column(String(50), default="pending")
    stages = Column(JSON, default=list)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(String(50), nullable=True)
    logs = Column(Text, default="")

    project = relationship("Project", back_populates="pipelines")

class KubernetesCluster(Base):
    __tablename__ = "kubernetes_clusters"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    provider = Column(String(50), default="EKS") # EKS, Minikube
    region = Column(String(50), default="us-east-1")
    version = Column(String(50), default="1.29")
    status = Column(String(50), default="active")
    node_count = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

class TerraformExecution(Base):
    __tablename__ = "terraform_executions"

    id = Column(String(50), primary_key=True, index=True)
    action = Column(String(50), nullable=False) # init, validate, plan, apply, destroy
    status = Column(String(50), default="pending")
    resources_to_add = Column(Integer, default=0)
    resources_to_change = Column(Integer, default=0)
    resources_to_destroy = Column(Integer, default=0)
    logs = Column(Text, default="")
    executed_by = Column(String(100), default="DevOps Engineer")
    created_at = Column(DateTime, default=datetime.utcnow)

class AiAnalysisRecord(Base):
    __tablename__ = "ai_analysis_records"

    id = Column(String(50), primary_key=True, index=True)
    context_type = Column(String(50), default="general")
    raw_log = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    possible_reasons = Column(JSON, default=list)
    recommended_solution = Column(Text, nullable=False)
    step_by_step_fix = Column(JSON, default=list)
    suggested_commands = Column(JSON, default=list)
    confidence_score = Column(Float, default=90.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class RollbackRecord(Base):
    __tablename__ = "rollback_records"

    id = Column(String(50), primary_key=True, index=True)
    deployment_id = Column(String(50), ForeignKey("deployments.id"), nullable=True)
    project_id = Column(String(50), nullable=False)
    project_name = Column(String(150), nullable=False)
    from_version = Column(String(50), nullable=False)
    to_version = Column(String(50), nullable=False)
    target_revision = Column(Integer, default=1)
    status = Column(String(50), default="success")
    triggered_by = Column(String(100), default="SRE Rollback Engine")
    reason = Column(Text, default="Readiness probe failure")
    k8s_command = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    deployment = relationship("Deployment", back_populates="rollbacks")
