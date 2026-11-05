import pytest
from app.services.incident_service import incident_service
from app.utils.security import validate_recovery_action

def test_detect_incidents_from_cluster():
    detected = incident_service.detect_incidents_from_cluster()
    assert len(detected) >= 1
    types = [d["error_type"] for d in detected]
    assert "CrashLoopBackOff" in types

def test_generate_ai_remedy():
    mock_incident = {
        "id": "inc-test-1",
        "service": "orders-api",
        "environment": "staging",
        "error_type": "CrashLoopBackOff",
        "log_snippet": "OutOfMemory: container memory limit exceeded 512Mi. Kernel exit code 137"
    }
    remedy = incident_service.generate_ai_remedy(mock_incident)
    assert remedy["action_type"] in ("increase_resource_limits", "restart_pod")
    assert remedy["confidence_score"] >= 70

def test_validate_recovery_action_allowlist():
    # Allowed action
    is_valid, msg = validate_recovery_action("increase_resource_limits", {"deployment": "orders-api", "memory_limit": "1Gi"})
    assert is_valid is True

    # Blocked arbitrary action
    is_valid_bad, msg_bad = validate_recovery_action("execute_raw_bash", {"cmd": "rm -rf /"})
    assert is_valid_bad is False
    assert "not permitted" in msg_bad

def test_execute_recovery_action_safe():
    success, logs, post_health = incident_service.execute_recovery_action(
        "increase_resource_limits",
        {"deployment": "orders-api", "recommended_memory": "1Gi", "namespace": "staging"},
        approved_by="Lead SRE"
    )
    assert success is True
    assert post_health == "healthy"
    assert "Incident resolved" in logs

def test_dispatch_notification():
    res = incident_service.dispatch_notification("slack", "Incident Detected", "CrashLoopBackOff in orders-api", "critical")
    assert res["status"] == "delivered"

