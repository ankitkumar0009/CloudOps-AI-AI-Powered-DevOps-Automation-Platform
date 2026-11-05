import re
import shlex
import logging

logger = logging.getLogger("devops.security")

# Allowed command prefixes to prevent arbitrary remote code execution / command injection
ALLOWED_COMMAND_PREFIXES = [
    "kubectl get",
    "kubectl describe",
    "kubectl top",
    "kubectl logs",
    "kubectl rollout undo",
    "kubectl rollout status",
    "kubectl rollout history",
    "docker ps",
    "docker images",
    "docker build",
    "aws ecr describe-repositories",
    "aws ecr list-images",
    "terraform init",
    "terraform validate",
    "terraform plan",
    "git status",
    "git log"
]

DANGEROUS_PATTERNS = [
    ";", "&&", "||", "|", "`", "$(", ">", "<", "\n", "\r",
    "rm -rf", "mkfs", "dd ", ":(){ :|:& };:", "drop table"
]

def sanitize_and_validate_command(cmd: str) -> bool:
    """Validates user command against DevSecOps safety rules."""
    cmd_clean = cmd.strip()

    # Check for dangerous shell metacharacters
    for pattern in DANGEROUS_PATTERNS:
        if pattern in cmd_clean:
            logger.warning(f"Rejected command containing forbidden pattern '{pattern}': {cmd_clean}")
            return False

    # Check whitelist prefix
    is_allowed = any(cmd_clean.startswith(prefix) for prefix in ALLOWED_COMMAND_PREFIXES)
    if not is_allowed:
        logger.warning(f"Command not permitted by safety guardrail policy: {cmd_clean}")
        return False

    return True

