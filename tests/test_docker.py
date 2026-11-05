import pytest
from app.services.docker_service import docker_service

def test_detect_runtime():
    assert docker_service.detect_runtime("") == "nodejs"

def test_generate_dockerfile():
    node_df = docker_service.generate_dockerfile("nodejs", 3000)
    assert "FROM node:20-alpine" in node_df
    assert "EXPOSE 3000" in node_df

    py_df = docker_service.generate_dockerfile("python", 8000)
    assert "FROM python:3.11-slim" in py_df
    assert "EXPOSE 8000" in py_df

    java_df = docker_service.generate_dockerfile("java", 8080)
    assert "FROM maven:" in java_df
    assert "EXPOSE 8080" in java_df

def test_build_image_mock():
    success, logs, img_data = docker_service.build_image("test-app", "v1.0.0", "python", 8000)
    assert success is True
    assert len(logs) > 5
    assert img_data["repository"] == "test-app"
    assert img_data["tag"] == "v1.0.0"
    assert img_data["size_mb"] > 0

