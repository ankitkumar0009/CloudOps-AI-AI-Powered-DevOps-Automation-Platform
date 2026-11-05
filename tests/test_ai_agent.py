import pytest
from app.services.ai_service import ai_service
from gemini_agent import GeminiDevOpsAgent

def test_ai_diagnosis_oom():
    log = "CrashLoopBackOff: Container killed with code 137 (OOMKilled) memory limit exceeded"
    res = ai_service.diagnose_log(log, "k8s_pod")
    assert "root_cause" in res
    assert "possible_reasons" in res
    assert "recommended_solution" in res
    assert len(res["suggested_commands"]) > 0
    assert "137" in res["root_cause"] or "OOM" in res["root_cause"] or "memory" in res["root_cause"].lower()

def test_ai_diagnosis_docker():
    log = "npm ERR! enoent ENOENT: no such file or directory, open '/app/package-lock.json'"
    res = ai_service.diagnose_log(log, "docker_build")
    assert "root_cause" in res
    assert "package-lock.json" in res["root_cause"] or "lockfile" in res["root_cause"].lower()

def test_standalone_gemini_agent():
    agent = GeminiDevOpsAgent()
    res = agent.analyze("CrashLoopBackOff exit code 137 OOMKilled", "k8s_pod")
    assert "root_cause" in res
    assert "suggested_commands" in res
    assert res["confidence_score"] >= 70

def test_ai_chat_response():
    res = ai_service.chat("What is the difference between AWS IAM OIDC and static access keys?")
    assert "reply" in res
    assert len(res["reply"]) > 20
