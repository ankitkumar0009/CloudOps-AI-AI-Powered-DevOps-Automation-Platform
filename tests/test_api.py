import pytest
from app.database import SessionLocal, init_db
from app.api.routes import (
    health_check,
    get_overview,
    get_projects,
    create_project,
    delete_project,
    get_aws_resources,
    get_pipelines,
    get_docker_images,
    get_kubernetes_status,
    get_terraform_status,
    get_rollbacks
)
from app.schemas import ProjectCreate
from app.models import Project

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()

def test_health_endpoint():
    db = SessionLocal()
    try:
        data = health_check(db)
        assert data["status"] == "healthy"
        assert "version" in data
        assert "aws_region" in data
    finally:
        db.close()

def test_get_overview():
    db = SessionLocal()
    try:
        data = get_overview(db)
        assert data["total_projects"] >= 4
        assert data["pipeline_success_rate"] > 0
        assert data["active_k8s_pods"] > 0
        assert data["infrastructure_status"] == "Healthy"
    finally:
        db.close()

def test_get_projects():
    db = SessionLocal()
    try:
        projects = get_projects(db)
        assert isinstance(projects, list)
        assert len(projects) >= 4
        names = [p.name for p in projects]
        assert "payment-gateway-service" in names
    finally:
        db.close()

def test_create_and_delete_project():
    db = SessionLocal()
    try:
        new_proj_data = ProjectCreate(
            name="integration-test-service",
            repo_url="https://github.com/enterprise/integration-test-service",
            branch="main",
            app_type="python",
            port=8080,
            replicas=2,
            cpu_limit="400m",
            memory_limit="512Mi",
            environment="staging",
            env_vars={"ENV": "test"}
        )
        existing = db.query(Project).filter(Project.name == "integration-test-service").first()
        if existing:
            db.delete(existing)
            db.commit()
        created = create_project(new_proj_data, db)
        assert created.name == "integration-test-service"
        assert created.id.startswith("proj-")

        # Delete it
        del_res = delete_project(created.id, db)
        assert "deleted successfully" in del_res["message"]
    finally:
        db.close()

def test_get_aws_resources():
    resources = get_aws_resources()
    assert len(resources) >= 4
    types = [r["type"] for r in resources]
    assert "VPC" in types
    assert "EKS" in types
    assert "ECR" in types

def test_get_pipelines():
    db = SessionLocal()
    try:
        pipes = get_pipelines(db)
        assert isinstance(pipes, list)
    finally:
        db.close()

def test_get_docker_images():
    db = SessionLocal()
    try:
        imgs = get_docker_images(db)
        assert isinstance(imgs, list)
    finally:
        db.close()

def test_get_kubernetes_status():
    k8s = get_kubernetes_status()
    assert "pods" in k8s
    assert "deployments" in k8s
    assert len(k8s["pods"]) > 0

def test_get_terraform_status():
    tf = get_terraform_status()
    assert tf["status"] == "success"
    assert tf["resources_to_add"] >= 0

def test_get_rollbacks():
    db = SessionLocal()
    try:
        rbs = get_rollbacks(db)
        assert len(rbs) > 0
    finally:
        db.close()
