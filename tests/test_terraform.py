import pytest
from app.services.terraform_service import terraform_service

def test_terraform_get_status():
    status = terraform_service.get_status()
    assert status["status"] == "success"
    assert "resources_to_add" in status
    assert len(status["logs"]) > 0

def test_terraform_execute_validate():
    res = terraform_service.execute("validate")
    assert res["status"] == "success"
    assert "terraform validate" in res["logs"][0]

def test_terraform_execute_invalid_action():
    with pytest.raises(ValueError):
        terraform_service.execute("malicious_command")
