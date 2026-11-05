from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Authentication & User Schemas ---
class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserRegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "devops" # admin, devops, security_admin, viewer

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Project Schemas ---
class ProjectBase(BaseModel):
    name: str
    repo_url: str
    branch: str = "main"
    app_type: str = "nodejs" # nodejs, python, java
    port: int = 3000
    replicas: int = 2
    cpu_limit: str = "500m"
    memory_limit: str = "512Mi"
    environment: str = "production"
    deployment_strategy: str = "rolling" # rolling, blue_green, canary
    webhook_secret: Optional[str] = "devops-webhook-secret-token"
    env_vars: Dict[str, str] = Field(default_factory=dict)

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime
    last_deployment_status: Optional[str] = "success"
    deployment_count: Optional[int] = 1

    model_config = ConfigDict(from_attributes=True)

# --- CI/CD & Deployment Schemas ---
class PipelineStageSchema(BaseModel):
    id: str
    name: str
    status: str # pending, running, success, failed, skipped
    duration: Optional[str] = None
    details: Optional[str] = None

class PipelineTriggerRequest(BaseModel):
    project_id: str
    branch: str = "main"
    strategy: Optional[str] = "rolling" # rolling, blue_green, canary
    canary_percentage: Optional[int] = 20

class PipelineResponse(BaseModel):
    id: str
    project_id: str
    project_name: str
    branch: str
    commit_sha: str
    commit_message: str
    status: str
    stages: List[PipelineStageSchema]
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[str] = None
    logs: List[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class DeploymentTriggerRequest(BaseModel):
    project_id: str
    version: Optional[str] = None
    strategy: str = "rolling" # rolling, blue_green, canary
    canary_percentage: int = 25
    environment: str = "production"

class DeploymentResponse(BaseModel):
    id: str
    project_id: str
    project_name: Optional[str] = None
    version: str
    commit_sha: str
    status: str
    strategy: str
    canary_percentage: int
    active_color: str
    k8s_namespace: str
    k8s_deployment_name: Optional[str] = None
    target_revision: int
    triggered_by: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[str] = None
    logs: str = ""

    model_config = ConfigDict(from_attributes=True)

# --- GitHub Integration Schemas ---
class GitHubCommitSchema(BaseModel):
    sha: str
    message: str
    author: str
    timestamp: str
    url: str

# --- Docker & Container Schemas ---
class DockerBuildRequest(BaseModel):
    project_id: str
    tag: str = "latest"

class DockerPushRequest(BaseModel):
    image_id: str
    repository_name: str

class DockerImageResponse(BaseModel):
    id: str
    repository: str
    tag: str
    digest: Optional[str] = None
    size_mb: float
    app_type: str
    vulnerabilities: Dict[str, int]
    optimization_tips: List[str] = Field(default_factory=list)
    pushed_to_ecr: bool
    ecr_uri: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Kubernetes Schemas ---
class KubernetesPodSchema(BaseModel):
    name: str
    namespace: str
    status: str
    restarts: int
    age: str
    cpu_usage: str
    memory_usage: str
    node: str
    ip: str
    ready: str

class KubernetesDeploymentSchema(BaseModel):
    name: str
    namespace: str
    desired_replicas: int
    available_replicas: int
    updated_replicas: int
    image: str
    status: str
    strategy: Optional[str] = "RollingUpdate"
    active_color: Optional[str] = "blue"
    canary_weight: Optional[int] = 0
    age: str

class KubernetesStatusResponse(BaseModel):
    pods: List[KubernetesPodSchema]
    deployments: List[KubernetesDeploymentSchema]
    events: List[str]

class KubernetesScaleRequest(BaseModel):
    deployment_name: str
    replicas: int
    namespace: str = "production"

# --- Terraform Schemas ---
class TerraformExecuteRequest(BaseModel):
    action: str # init, validate, plan, apply, destroy

class TerraformRunResponse(BaseModel):
    action: str
    status: str
    last_run: Optional[str] = None
    resources_to_add: int = 0
    resources_to_change: int = 0
    resources_to_destroy: int = 0
    logs: List[str] = Field(default_factory=list)

# --- Module 2: AI Incident Management & Auto-Healing Schemas ---
class AiDiagnoseRequest(BaseModel):
    log_snippet: str
    context_type: str = "k8s_pod"

class AiDiagnoseResponse(BaseModel):
    id: str
    context_type: str
    log_snippet: str
    root_cause: str
    possible_reasons: List[str]
    recommended_solution: str
    step_by_step_fix: List[str]
    suggested_commands: List[str]
    confidence_score: float
    analyzed_at: datetime

class AiChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = Field(default_factory=list)

class AiChatResponse(BaseModel):
    reply: str
    suggested_commands: List[str] = Field(default_factory=list)

class AiRecommendationResponse(BaseModel):
    id: str
    incident_id: str
    root_cause_explanation: str
    recommended_solution: str
    action_type: str
    action_payload: Dict[str, Any]
    suggested_commands: List[str]
    potential_risks: str
    expected_outcome: str
    confidence_score: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IncidentResponse(BaseModel):
    id: str
    service: str
    environment: str
    title: str
    error_type: str
    severity: str
    status: str
    root_cause: str
    log_snippet: str
    metrics_snapshot: Dict[str, Any]
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    mttr_seconds: Optional[int] = None
    recommendations: List[AiRecommendationResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class IncidentCreateRequest(BaseModel):
    service: str
    environment: str = "production"
    title: str
    error_type: str
    severity: str = "high"
    log_snippet: str = ""

class RecoveryApprovalRequest(BaseModel):
    action_id: str
    decision: str # approve, reject
    approved_by: str = "DevOps Lead"

class RecoveryActionResponse(BaseModel):
    id: str
    incident_id: str
    recommendation_id: Optional[str] = None
    action_type: str
    parameters: Dict[str, Any]
    status: str
    requested_by: str
    approved_by: Optional[str] = None
    approval_expires_at: Optional[datetime] = None
    execution_logs: str = ""
    post_health_status: str
    created_at: datetime
    executed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Module 3: DevSecOps Schemas ---
class SecurityScanTriggerRequest(BaseModel):
    project_id: Optional[str] = None
    scan_type: str # sonarqube, pytest, gitleaks, trivy, checkov, owasp_zap
    target: Optional[str] = None

class SecurityScanResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    scan_type: str
    target: str
    status: str
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    findings: List[Dict[str, Any]]
    quality_gate: str
    summary: str
    scan_duration: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DevSecOpsSummaryResponse(BaseModel):
    overall_status: str # PASSED, FAILED, WARNING
    critical_vulnerabilities: int
    high_vulnerabilities: int
    secret_leaks_prevented: int
    iac_misconfigurations: int
    scans_completed: int
    last_scan_time: Optional[datetime] = None
    scans: List[SecurityScanResponse] = Field(default_factory=list)

# --- Rollback & History Schemas ---
class RollbackTriggerRequest(BaseModel):
    project_id: str
    deployment_name: str
    target_revision: Optional[int] = None

class RollbackResponse(BaseModel):
    id: str
    deployment_id: Optional[str] = None
    project_id: str
    project_name: str
    from_version: str
    to_version: str
    target_revision: int
    status: str
    triggered_by: str
    timestamp: datetime
    reason: str
    k8s_command: str

    model_config = ConfigDict(from_attributes=True)

# --- Auditing & System Schemas ---
class AuditLogResponse(BaseModel):
    id: str
    username: str
    action: str
    resource_type: str
    resource_id: str
    details: Dict[str, Any]
    ip_address: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationDispatchRequest(BaseModel):
    channel: str # email, sns, slack
    title: str
    message: str
    severity: str = "info"

class SystemOverviewResponse(BaseModel):
    total_projects: int
    successful_deployments: int
    failed_deployments: int
    running_containers: int
    active_k8s_pods: int
    active_incidents: int = 1
    security_score: int = 96
    pipeline_success_rate: float
    infrastructure_status: str
    recent_activity: List[Dict[str, Any]]

class HealthResponse(BaseModel):
    status: str
    mode: str
    version: str
    database: str
    aws_region: str
