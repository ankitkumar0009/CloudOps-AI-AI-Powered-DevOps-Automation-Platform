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
    JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="devops") # admin, devops, security_admin, viewer
    is_active = Column(Boolean, default=True)
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
    deployment_strategy = Column(String(50), default="rolling") # rolling, blue_green, canary
    webhook_secret = Column(String(100), default="devops-webhook-secret-token")
    env_vars = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    deployments = relationship("Deployment", back_populates="project", cascade="all, delete-orphan")
    pipelines = relationship("PipelineExecution", back_populates="project", cascade="all, delete-orphan")
    docker_images = relationship("DockerImage", back_populates="project", cascade="all, delete-orphan")
    security_scans = relationship("SecurityScan", back_populates="project", cascade="all, delete-orphan")

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=False)
    version = Column(String(50), nullable=False)
    commit_sha = Column(String(50), nullable=False)
    status = Column(String(50), default="pending") # pending, running, success, failed, rolled_back, canary_evaluating
    strategy = Column(String(50), default="rolling") # rolling, blue_green, canary
    canary_percentage = Column(Integer, default=0) # 0 to 100 for canary weight
    active_color = Column(String(20), default="blue") # blue or green
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
    optimization_tips = Column(JSON, default=list)
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
    endpoint = Column(String(255), nullable=True)
    cluster_health = Column(JSON, default=lambda: {"api_server": "Healthy", "etcd": "Healthy", "controller_manager": "Healthy"})
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

# --- Module 2: Incidents, AI Recommendations & Auto-Healing Recovery Actions ---

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True)
    service = Column(String(150), nullable=False)
    environment = Column(String(50), default="production")
    title = Column(String(255), nullable=False)
    error_type = Column(String(100), nullable=False) # CrashLoopBackOff, OOMKilled, ImagePullBackOff, HighCPU, HighMemory, Downtime5xx, HealthCheckFailed
    severity = Column(String(50), default="high") # critical, high, medium, low
    status = Column(String(50), default="active") # active, investigating, recovery_pending, resolved
    root_cause = Column(Text, default="Analyzing with Gemini AI...")
    log_snippet = Column(Text, default="")
    metrics_snapshot = Column(JSON, default=dict)
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    mttr_seconds = Column(Integer, nullable=True)

    recommendations = relationship("AiRecommendation", back_populates="incident", cascade="all, delete-orphan")
    recovery_actions = relationship("RecoveryAction", back_populates="incident", cascade="all, delete-orphan")

class AiRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False)
    root_cause_explanation = Column(Text, nullable=False)
    recommended_solution = Column(Text, nullable=False)
    action_type = Column(String(100), nullable=False) # restart_pod, scale_deployment, rollback_deployment, increase_resource_limits, reapply_manifest, restart_service
    action_payload = Column(JSON, default=dict)
    suggested_commands = Column(JSON, default=list)
    potential_risks = Column(Text, default="Low risk under standard rollback procedure.")
    expected_outcome = Column(Text, default="Immediate service stabilization.")
    confidence_score = Column(Integer, default=95)
    created_at = Column(DateTime, default=datetime.utcnow)

    incident = relationship("Incident", back_populates="recommendations")

class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(String(50), primary_key=True, index=True)
    incident_id = Column(String(50), ForeignKey("incidents.id"), nullable=False)
    recommendation_id = Column(String(50), nullable=True)
    action_type = Column(String(100), nullable=False)
    parameters = Column(JSON, default=dict)
    status = Column(String(50), default="pending_approval") # pending_approval, approved, rejected, executing, executed, failed
    requested_by = Column(String(100), default="AI DevOps Agent")
    approved_by = Column(String(100), nullable=True)
    approval_expires_at = Column(DateTime, nullable=True)
    execution_logs = Column(Text, default="")
    post_health_status = Column(String(50), default="pending") # pending, healthy, degraded
    created_at = Column(DateTime, default=datetime.utcnow)
    executed_at = Column(DateTime, nullable=True)

    incident = relationship("Incident", back_populates="recovery_actions")

# --- Module 3: DevSecOps Scans (SonarQube, Gitleaks, Trivy, Checkov, OWASP ZAP) ---

class SecurityScan(Base):
    __tablename__ = "security_scans"

    id = Column(String(50), primary_key=True, index=True)
    project_id = Column(String(50), ForeignKey("projects.id"), nullable=True)
    scan_type = Column(String(50), nullable=False) # sonarqube, pytest, gitleaks, trivy, checkov, owasp_zap
    target = Column(String(255), nullable=False) # repository, container image, terraform directory, url
    status = Column(String(50), default="passed") # passed, failed, warning
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    findings = Column(JSON, default=list)
    quality_gate = Column(String(50), default="PASSED") # PASSED, FAILED, OVERRIDDEN
    summary = Column(Text, default="")
    scan_duration = Column(String(50), default="12s")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="security_scans")

# --- Enterprise Auditing & Compliance ---

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, index=True)
    user_id = Column(String(50), nullable=True)
    username = Column(String(100), default="devops-system")
    action = Column(String(100), nullable=False)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(100), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.utcnow)
