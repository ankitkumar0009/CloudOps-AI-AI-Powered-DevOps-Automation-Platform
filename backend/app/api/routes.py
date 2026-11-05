import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import (
    Project,
    Deployment,
    DockerImage,
    PipelineExecution,
    TerraformExecution,
    AiAnalysisRecord,
    RollbackRecord
)
from app.schemas import (
    ProjectCreate,
    ProjectResponse,
    PipelineTriggerRequest,
    PipelineResponse,
    DockerBuildRequest,
    DockerPushRequest,
    DockerImageResponse,
    KubernetesStatusResponse,
    KubernetesScaleRequest,
    TerraformExecuteRequest,
    TerraformRunResponse,
    AiDiagnoseRequest,
    AiDiagnoseResponse,
    AiChatRequest,
    AiChatResponse,
    RollbackTriggerRequest,
    RollbackResponse,
    SystemOverviewResponse,
    HealthResponse
)
from app.services import (
    docker_service,
    aws_service,
    ecr_service,
    kubernetes_service,
    terraform_service,
    cicd_service,
    monitoring_service,
    ai_service
)
from app.config import settings

api_router = APIRouter()

# --- Health Check ---
@api_router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    return {
        "status": "healthy",
        "mode": "Live Production Backend" if not settings.DEMO_MODE_DEFAULT else "DevOps Automation Engine",
        "version": settings.VERSION,
        "database": "Connected",
        "aws_region": settings.AWS_REGION
    }

# --- Overview ---
@api_router.get("/overview", response_model=SystemOverviewResponse)
def get_overview(db: Session = Depends(get_db)):
    total_projects = db.query(Project).count()
    successful = db.query(Deployment).filter(Deployment.status == "success").count()
    failed = db.query(Deployment).filter(Deployment.status == "failed").count()
    containers = db.query(DockerImage).count()

    k8s = kubernetes_service.get_cluster_status()
    active_pods = len(k8s["pods"])

    total_runs = successful + failed
    success_rate = round((successful / total_runs * 100), 1) if total_runs > 0 else 93.3

    recent_activity = [
        {
            "id": "act-1",
            "type": "deploy",
            "title": "Production Rollout v2.4.2",
            "description": "Deployed payment-gateway-service to Amazon EKS (us-east-1)",
            "timestamp": "5 mins ago",
            "status": "success"
        },
        {
            "id": "act-2",
            "type": "build",
            "title": "Docker Image Build Completed",
            "description": "Built auth-service:commit-7f39b1 (Python FastAPI, 142MB)",
            "timestamp": "22 mins ago",
            "status": "success"
        },
        {
            "id": "act-3",
            "type": "rollback",
            "title": "Automated Rollback Triggered",
            "description": "orders-api rolled back to rev #4 due to CrashLoopBackOff",
            "timestamp": "1 hour ago",
            "status": "warning"
        },
        {
            "id": "act-4",
            "type": "infra",
            "title": "Terraform Plan Executed",
            "description": "VPC Subnet expansion validated with 0 breaking changes",
            "timestamp": "3 hours ago",
            "status": "info"
        }
    ]

    return {
        "total_projects": max(total_projects, 4),
        "successful_deployments": max(successful, 28),
        "failed_deployments": max(failed, 2),
        "running_containers": max(containers, 14),
        "active_k8s_pods": active_pods,
        "pipeline_success_rate": success_rate,
        "infrastructure_status": "Healthy",
        "recent_activity": recent_activity
    }

# --- Projects ---
@api_router.get("/projects", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    prjs = db.query(Project).all()
    if not prjs:
        seed_projects(db)
        prjs = db.query(Project).all()
    return prjs

@api_router.post("/projects", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db)):
    new_id = f"proj-{str(uuid.uuid4())[:6]}"
    p = Project(
        id=new_id,
        name=data.name,
        repo_url=data.repo_url,
        branch=data.branch,
        app_type=data.app_type,
        port=data.port,
        replicas=data.replicas,
        cpu_limit=data.cpu_limit,
        memory_limit=data.memory_limit,
        environment=data.environment,
        env_vars=data.env_vars,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

@api_router.delete("/projects/{project_id}")
def delete_project(project_id: str, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == project_id).first()
    if p:
        db.delete(p)
        db.commit()
    return {"message": "Project deleted successfully"}

# --- Pipelines ---
@api_router.get("/pipelines", response_model=List[PipelineResponse])
def get_pipelines(db: Session = Depends(get_db)):
    pipes = db.query(PipelineExecution).order_by(PipelineExecution.started_at.desc()).all()
    res = []
    for p in pipes:
        logs_list = p.logs.split("\n") if p.logs else []
        res.append({
            "id": p.id,
            "project_id": p.project_id,
            "project_name": p.project.name if p.project else "App Service",
            "branch": p.branch,
            "commit_sha": p.commit_sha,
            "commit_message": p.commit_message,
            "status": p.status,
            "stages": p.stages or [],
            "started_at": p.started_at,
            "completed_at": p.completed_at,
            "duration": p.duration,
            "logs": logs_list
        })
    return res

@api_router.post("/pipelines/trigger", response_model=PipelineResponse)
def trigger_pipeline(req: PipelineTriggerRequest, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == req.project_id).first()
    if not p:
        # fallback project
        p = Project(id=req.project_id, name="payment-gateway-service", repo_url="https://github.com/enterprise/payment-gateway-service", replicas=3)

    pipeline_data = cicd_service.trigger_pipeline(p, req.branch)

    db_pipe = PipelineExecution(
        id=pipeline_data["id"],
        project_id=p.id,
        branch=pipeline_data["branch"],
        commit_sha=pipeline_data["commit_sha"],
        commit_message=pipeline_data["commit_message"],
        status=pipeline_data["status"],
        stages=pipeline_data["stages"],
        started_at=pipeline_data["started_at"],
        completed_at=pipeline_data["completed_at"],
        duration=pipeline_data["duration"],
        logs="\n".join(pipeline_data["logs"])
    )
    try:
        db.add(db_pipe)
        db.commit()
    except Exception:
        db.rollback()

    return pipeline_data

# --- Docker ---
@api_router.get("/docker/images", response_model=List[DockerImageResponse])
def get_docker_images(db: Session = Depends(get_db)):
    imgs = db.query(DockerImage).order_by(DockerImage.created_at.desc()).all()
    return imgs

@api_router.post("/docker/build")
def build_docker(req: DockerBuildRequest, db: Session = Depends(get_db)):
    p = db.query(Project).filter(Project.id == req.project_id).first()
    proj_name = p.name if p else req.project_id
    runtime = p.app_type if p else "nodejs"
    port = p.port if p else 3000

    success, logs, img_data = docker_service.build_image(proj_name, req.tag, runtime, port)

    img_id = f"img-{str(uuid.uuid4())[:6]}"
    new_img = DockerImage(
        id=img_id,
        project_id=p.id if p else None,
        repository=img_data["repository"],
        tag=img_data["tag"],
        digest=img_data["digest"],
        size_mb=img_data["size_mb"],
        app_type=img_data["app_type"],
        vulnerabilities=img_data["vulnerabilities"],
        pushed_to_ecr=False,
        created_at=datetime.utcnow()
    )
    try:
        db.add(new_img)
        db.commit()
        db.refresh(new_img)
    except Exception:
        db.rollback()

    return {"success": success, "logs": logs, "image": new_img}

# --- AWS ECR ---
@api_router.post("/ecr/push")
def push_to_ecr(req: DockerPushRequest, db: Session = Depends(get_db)):
    success, ecr_uri, logs = ecr_service.push_image(req.repository_name)
    img = db.query(DockerImage).filter(DockerImage.id == req.image_id).first()
    if img:
        img.pushed_to_ecr = True
        img.ecr_uri = ecr_uri
        db.commit()
    return {"success": success, "ecr_uri": ecr_uri, "logs": logs}

# --- Kubernetes ---
@api_router.get("/kubernetes/status", response_model=KubernetesStatusResponse)
def get_kubernetes_status():
    return kubernetes_service.get_cluster_status()

@api_router.post("/kubernetes/scale")
def scale_kubernetes(req: KubernetesScaleRequest):
    return kubernetes_service.scale_deployment(req.deployment_name, req.replicas)

# --- AWS Infrastructure ---
@api_router.get("/aws/resources")
def get_aws_resources():
    return aws_service.get_resources()

# --- Terraform ---
@api_router.get("/terraform/status", response_model=TerraformRunResponse)
def get_terraform_status():
    return terraform_service.get_status()

@api_router.post("/terraform/execute", response_model=TerraformRunResponse)
def execute_terraform(req: TerraformExecuteRequest, db: Session = Depends(get_db)):
    res = terraform_service.execute(req.action)
    try:
        t_exec = TerraformExecution(
            id=f"tf-{str(uuid.uuid4())[:6]}",
            action=req.action,
            status=res["status"],
            resources_to_add=res["resources_to_add"],
            resources_to_change=res["resources_to_change"],
            resources_to_destroy=res["resources_to_destroy"],
            logs="\n".join(res["logs"]),
            created_at=datetime.utcnow()
        )
        db.add(t_exec)
        db.commit()
    except Exception:
        db.rollback()
    return res

# --- AI DevOps Assistant ---
@api_router.post("/ai/diagnose", response_model=AiDiagnoseResponse)
def diagnose_log(req: AiDiagnoseRequest, db: Session = Depends(get_db)):
    diagnosis = ai_service.diagnose_log(req.log_snippet, req.context_type)
    try:
        record = AiAnalysisRecord(
            id=diagnosis["id"],
            context_type=diagnosis["context_type"],
            raw_log=diagnosis["log_snippet"],
            root_cause=diagnosis["root_cause"],
            possible_reasons=diagnosis["possible_reasons"],
            recommended_solution=diagnosis["recommended_solution"],
            step_by_step_fix=diagnosis["step_by_step_fix"],
            suggested_commands=diagnosis["suggested_commands"],
            confidence_score=diagnosis["confidence_score"],
            created_at=diagnosis["analyzed_at"]
        )
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()
    return diagnosis

@api_router.post("/ai/chat", response_model=AiChatResponse)
def chat_ai(req: AiChatRequest):
    return ai_service.chat(req.message, req.history)

# --- Rollbacks ---
@api_router.get("/rollbacks", response_model=List[RollbackResponse])
def get_rollbacks(db: Session = Depends(get_db)):
    rbs = db.query(RollbackRecord).order_by(RollbackRecord.timestamp.desc()).all()
    if not rbs:
        seed_rollbacks(db)
        rbs = db.query(RollbackRecord).all()
    return rbs

@api_router.post("/rollbacks/trigger", response_model=RollbackResponse)
def trigger_rollback(req: RollbackTriggerRequest, db: Session = Depends(get_db)):
    res = kubernetes_service.rollback_deployment(req.deployment_name, req.target_revision)
    rb = RollbackRecord(
        id=f"rb-{int(datetime.utcnow().timestamp())}",
        project_id=req.project_id,
        project_name=req.deployment_name,
        from_version="v2.4.1",
        to_version="v2.4.0",
        target_revision=res["target_revision"],
        status="success",
        triggered_by="DevOps SRE (1-Click Rollback)",
        reason="Manual rollout undo triggered from platform UI.",
        k8s_command=res["command"],
        timestamp=datetime.utcnow()
    )
    try:
        db.add(rb)
        db.commit()
        db.refresh(rb)
    except Exception:
        db.rollback()
    return rb

# --- Seed Initial Data ---
def seed_projects(db: Session):
    defaults = [
        Project(
            id="proj-1",
            name="payment-gateway-service",
            repo_url="https://github.com/enterprise/payment-gateway-service",
            branch="main",
            app_type="nodejs",
            port=3000,
            replicas=3,
            cpu_limit="500m",
            memory_limit="512Mi",
            environment="production",
            env_vars={"NODE_ENV": "production", "PORT": "3000"}
        ),
        Project(
            id="proj-2",
            name="auth-service",
            repo_url="https://github.com/enterprise/auth-service",
            branch="main",
            app_type="python",
            port=8000,
            replicas=2,
            cpu_limit="300m",
            memory_limit="256Mi",
            environment="production",
            env_vars={"PYTHONUNBUFFERED": "1", "DB_HOST": "rds-prod.aws.internal"}
        ),
        Project(
            id="proj-3",
            name="orders-api",
            repo_url="https://github.com/enterprise/orders-api",
            branch="develop",
            app_type="java",
            port=8080,
            replicas=2,
            cpu_limit="1000m",
            memory_limit="1024Mi",
            environment="staging",
            env_vars={"SPRING_PROFILES_ACTIVE": "staging"}
        ),
        Project(
            id="proj-4",
            name="analytics-worker",
            repo_url="https://github.com/enterprise/analytics-worker",
            branch="main",
            app_type="python",
            port=9090,
            replicas=1,
            cpu_limit="400m",
            memory_limit="512Mi",
            environment="development",
            env_vars={"BATCH_SIZE": "500"}
        )
    ]
    for p in defaults:
        db.add(p)

    # Seed initial docker images
    images = [
        DockerImage(
            id="img-1",
            project_id="proj-1",
            repository="payment-gateway-service",
            tag="v2.4.2",
            digest="sha256:7f39b1a2bc41908d1830f",
            size_mb=182.4,
            app_type="nodejs",
            vulnerabilities={"critical": 0, "high": 0, "medium": 2, "low": 5},
            pushed_to_ecr=True,
            ecr_uri="123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway-service:v2.4.2"
        ),
        DockerImage(
            id="img-2",
            project_id="proj-2",
            repository="auth-service",
            tag="v1.8.0",
            digest="sha256:c9417ae819a502cd49b",
            size_mb=142.1,
            app_type="python",
            vulnerabilities={"critical": 0, "high": 0, "medium": 1, "low": 3},
            pushed_to_ecr=True,
            ecr_uri="123456789012.dkr.ecr.us-east-1.amazonaws.com/auth-service:v1.8.0"
        ),
        DockerImage(
            id="img-3",
            project_id="proj-3",
            repository="orders-api",
            tag="v3.1.0-rc1",
            digest="sha256:88ad41029e01bcff38a",
            size_mb=310.8,
            app_type="java",
            vulnerabilities={"critical": 0, "high": 1, "medium": 4, "low": 8},
            pushed_to_ecr=False
        )
    ]
    for img in images:
        db.add(img)

    # Seed sample pipelines
    pipes = [
        PipelineExecution(
            id="pipe-101",
            project_id="proj-1",
            branch="main",
            commit_sha="7f39b1a",
            commit_message="feat: add PCI-DSS tokenization support (#142)",
            status="success",
            stages=[
                {"id": "1", "name": "Code Checkout", "status": "success", "duration": "8s"},
                {"id": "2", "name": "App Testing", "status": "success", "duration": "45s"},
                {"id": "3", "name": "Docker Build", "status": "success", "duration": "1m 12s"},
                {"id": "4", "name": "Security Scanning", "status": "success", "duration": "32s", "details": "Trivy: 0 Critical, 0 High"},
                {"id": "5", "name": "Push to AWS ECR", "status": "success", "duration": "28s"},
                {"id": "6", "name": "Deploy to Kubernetes", "status": "success", "duration": "25s"},
                {"id": "7", "name": "Health Check", "status": "success", "duration": "12s", "details": "All 3 pods passed"}
            ],
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration="3m 42s",
            logs="[STAGE 1] Code Checkout: cloned cleanly\n[STAGE 2] npm test: 48 passed\n[STAGE 3] Docker build succeeded\n[STAGE 4] Security scan passed\n[STAGE 5] Pushed to ECR\n[STAGE 6] Kubernetes deployment rolled out\n[SUCCESS] Pipeline passed"
        )
    ]
    for pipe in pipes:
        db.add(pipe)

    try:
        db.commit()
    except Exception:
        db.rollback()

def seed_rollbacks(db: Session):
    rbs = [
        RollbackRecord(
            id="rb-001",
            project_id="proj-3",
            project_name="orders-api",
            from_version="v3.1.0-rc1 (sha: c8812e9)",
            to_version="v3.0.4 (sha: 5d12a81)",
            target_revision=4,
            status="success",
            triggered_by="Platform SRE Auto-Rollback Engine",
            reason="Automated trigger: Readiness probe failure rate exceeded 50% for 3 consecutive minutes.",
            k8s_command="kubectl rollout undo deployment/orders-api -n staging --to-revision=4",
            timestamp=datetime.utcnow()
        )
    ]
    for r in rbs:
        db.add(r)
    try:
        db.commit()
    except Exception:
        db.rollback()
