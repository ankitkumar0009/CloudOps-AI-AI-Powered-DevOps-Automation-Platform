import pytest
from app.services.devsecops_service import devsecops_service

def test_sonarqube_quality_gate():
    res = devsecops_service.run_sonarqube_scan("payment-gateway-service")
    assert res["status"] == "passed"
    assert res["quality_gate"] == "PASSED"
    assert res["critical_count"] == 0

def test_gitleaks_secret_masking():
    # Pass text with mock secret to test detection and masking
    dirty_text = "AWS_SECRET_KEY=AKIAIOSFODNN7EXAMPLE\nAPI_KEY=AIzaSyD-1234567890abcdefghijklmnopq"
    res = devsecops_service.run_gitleaks_scan("test-service", dirty_text)
    assert res["status"] == "failed"
    assert res["quality_gate"] == "FAILED"
    assert res["critical_count"] >= 1
    # Check that mask was applied
    for f in res["findings"]:
        assert f["masked_match"] == "[MASKED_SECRET]"

def test_gitleaks_clean_content():
    clean_text = "APP_ENV=production\nPORT=3000\nDATABASE_URL=sqlite:///./devops.db"
    res = devsecops_service.run_gitleaks_scan("test-service", clean_text)
    assert res["status"] == "passed"
    assert res["critical_count"] == 0

def test_trivy_container_scan():
    res = devsecops_service.run_trivy_scan("payment-gateway-service:v2.4.2")
    assert res["status"] == "passed"
    assert res["critical_count"] == 0

def test_checkov_iac_scan():
    res = devsecops_service.run_checkov_scan("terraform/modules/")
    assert res["status"] == "passed"
    assert res["critical_count"] == 0

def test_owasp_zap_scan():
    res = devsecops_service.run_owasp_zap_scan("http://localhost:3000")
    assert res["status"] == "passed"
    assert res["critical_count"] == 0

def test_evaluate_security_gate_pass():
    scans = [
        {"critical_count": 0, "high_count": 0},
        {"critical_count": 0, "high_count": 1}
    ]
    passed, msg = devsecops_service.evaluate_security_gate(scans)
    assert passed is True
    assert "PASSED" in msg

def test_evaluate_security_gate_fail_critical():
    scans = [
        {"critical_count": 1, "high_count": 0}
    ]
    passed, msg = devsecops_service.evaluate_security_gate(scans)
    assert passed is False
    assert "BLOCKED" in msg

