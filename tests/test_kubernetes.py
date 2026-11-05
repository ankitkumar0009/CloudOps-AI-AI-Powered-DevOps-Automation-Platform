import pytest
from app.services.kubernetes_service import kubernetes_service

def test_generate_manifest():
    manifest = kubernetes_service.generate_manifest(
        app_name="payment-svc",
        image_uri="123456789012.dkr.ecr.us-east-1.amazonaws.com/payment:v1",
        port=3000,
        replicas=3
    )
    assert "kind: Deployment" in manifest
    assert "kind: Service" in manifest
    assert "replicas: 3" in manifest
    assert "containerPort: 3000" in manifest

def test_get_cluster_status():
    status = kubernetes_service.get_cluster_status()
    assert "pods" in status
    assert "deployments" in status
    assert "events" in status
    assert len(status["pods"]) > 0

def test_scale_deployment():
    res = kubernetes_service.scale_deployment("payment-gateway", 4, "production")
    assert res["success"] is True
    assert "4 replicas" in res["message"]

def test_rollback_deployment():
    res = kubernetes_service.rollback_deployment("payment-gateway", 2, "production")
    assert res["success"] is True
    assert "kubectl rollout undo deployment/payment-gateway" in res["command"]
