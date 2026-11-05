import pytest
from app.services.kubernetes_service import kubernetes_service
from app.services.github_service import github_service

def test_blue_green_manifest_generation():
    manifest = kubernetes_service.generate_manifest(
        app_name="auth-service",
        image_uri="auth-service:v1.8.0",
        strategy="blue_green"
    )
    assert "name: auth-service-blue" in manifest
    assert "name: auth-service-green" in manifest
    assert "color: blue" in manifest

def test_canary_manifest_generation():
    manifest = kubernetes_service.generate_manifest(
        app_name="orders-api",
        image_uri="orders-api:v3.1.0",
        strategy="canary",
        canary_weight=25
    )
    assert "name: orders-api-primary" in manifest
    assert "name: orders-api-canary" in manifest
    assert "track: canary" in manifest

def test_switch_blue_green():
    res = kubernetes_service.switch_blue_green("auth-service", "green")
    assert res["success"] is True
    assert res["active_color"] == "green"

def test_update_canary_weight():
    res = kubernetes_service.update_canary_weight("orders-api", 50)
    assert res["success"] is True
    assert res["canary_weight"] == 50

def test_github_commit_history():
    commits = github_service.get_commit_history("https://github.com/enterprise/payment-gateway-service", count=5)
    assert len(commits) == 5
    assert "sha" in commits[0]
    assert "message" in commits[0]
    assert "author" in commits[0]

