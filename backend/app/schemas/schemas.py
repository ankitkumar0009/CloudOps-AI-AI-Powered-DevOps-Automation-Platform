from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

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

class PipelineStageSchema(BaseModel):
    id: str
    name: str
    status: str # pending, running, success, failed, skipped
    duration: Optional[str] = None
    details: Optional[str] = None

class PipelineTriggerRequest(BaseModel):
    project_id: str
    branch: str = "main"

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
    pushed_to_ecr: bool
    ecr_uri: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

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
    age: str

class KubernetesStatusResponse(BaseModel):
    pods: List[KubernetesPodSchema]
    deployments: List[KubernetesDeploymentSchema]
    events: List[str]

class KubernetesScaleRequest(BaseModel):
    deployment_name: str
    replicas: int

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

class SystemOverviewResponse(BaseModel):
    total_projects: int
    successful_deployments: int
    failed_deployments: int
    running_containers: int
    active_k8s_pods: int
    pipeline_success_rate: float
    infrastructure_status: str
    recent_activity: List[Dict[str, Any]]

class HealthResponse(BaseModel):
    status: str
    mode: str
    version: str
    database: str
    aws_region: str
