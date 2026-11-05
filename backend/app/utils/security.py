import re
import os
import json
import base64
import hmac
import hashlib
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger("devops.security")

# Security key configuration (Derived from environment or safe production fallback)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "cloudops-ai-enterprise-secret-key-2026-v2")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Allowed command prefixes to prevent arbitrary remote code execution / command injection
ALLOWED_COMMAND_PREFIXES = [
    "kubectl get",
    "kubectl describe",
    "kubectl top",
    "kubectl logs",
    "kubectl rollout undo",
    "kubectl rollout status",
    "kubectl rollout history",
    "kubectl scale",
    "docker ps",
    "docker images",
    "docker build",
    "docker scan",
    "aws ecr describe-repositories",
    "aws ecr list-images",
    "aws ecr get-login-password",
    "aws eks describe-cluster",
    "terraform init",
    "terraform validate",
    "terraform plan",
    "git status",
    "git log",
    "pytest"
]

DANGEROUS_PATTERNS = [
    ";", "&&", "||", "|", "`", "$(", ">", "<", "\n", "\r",
    "rm -rf", "mkfs", "dd ", ":(){ :|:& };:", "drop table", "shutdown"
]

# Strictly allowlisted autonomous recovery actions (Module 2 Auto-Healing)
ALLOWED_RECOVERY_ACTIONS = {
    "restart_pod",
    "scale_deployment",
    "rollback_deployment",
    "increase_resource_limits",
    "reapply_manifest",
    "restart_service",
    "drain_node_safely"
}

# Role definitions for Role-Based Access Control (RBAC)
ROLE_HIERARCHY = {
    "admin": ["admin", "devops", "security_admin", "viewer"],
    "devops": ["devops", "viewer"],
    "security_admin": ["security_admin", "viewer"],
    "viewer": ["viewer"]
}

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

def validate_recovery_action(action_type: str, parameters: Dict[str, Any]) -> Tuple[bool, str]:
    """Validates that a recovery action is strictly in the approved allowlist."""
    if action_type not in ALLOWED_RECOVERY_ACTIONS:
        return False, f"Action '{action_type}' is not permitted in autonomous recovery allowlist."
    
    # Validate parameters
    if action_type in ("scale_deployment", "rollback_deployment", "restart_pod", "increase_resource_limits"):
        if not parameters.get("deployment") and not parameters.get("pod_name"):
            return False, "Missing target deployment or pod identifier in recovery parameters."
    
    return True, "Action approved by DevSecOps validation policy."

# --- Password Hashing (PBKDF2-HMAC-SHA256) ---
def hash_password(password: str) -> str:
    """Generates a secure salted PBKDF2 hash of the password."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return base64.b64encode(salt + key).decode("ascii")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash."""
    try:
        raw = base64.b64decode(hashed_password.encode("ascii"))
        salt = raw[:16]
        stored_key = raw[16:]
        computed_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(stored_key, computed_key)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False

# --- Cryptographic JWT Tokens (RFC 7519 HMAC-SHA256) ---
def _b64_url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")

def _b64_url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("ascii"))

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates an RFC 7519 compliant HMAC-SHA256 JWT token."""
    to_encode = data.copy()
    now = int(time.time())
    if expires_delta:
        expire = now + int(expires_delta.total_seconds())
    else:
        expire = now + (JWT_EXPIRATION_HOURS * 3600)
    
    to_encode.update({"iat": now, "exp": expire})
    
    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_json = json.dumps(to_encode, separators=(",", ":")).encode("utf-8")
    
    encoded_header = _b64_url_encode(header_json)
    encoded_payload = _b64_url_encode(payload_json)
    
    signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
    signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
    encoded_signature = _b64_url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates an HMAC-SHA256 JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        encoded_header, encoded_payload, encoded_signature = parts
        signing_input = f"{encoded_header}.{encoded_payload}".encode("ascii")
        expected_sig = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256).digest()
        actual_sig = _b64_url_decode(encoded_signature)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_bytes = _b64_url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode("utf-8"))
        
        # Expiration check
        if payload.get("exp") and int(time.time()) > payload["exp"]:
            logger.info("JWT token has expired.")
            return None
        
        return payload
    except Exception as e:
        logger.warning(f"JWT verification failure: {e}")
        return None

# --- GitHub Webhook Signature Verification ---
def verify_github_signature(payload_body: bytes, hub_signature: str, secret: str) -> bool:
    """Verifies HMAC SHA-256 signature on incoming GitHub webhooks (X-Hub-Signature-256)."""
    if not hub_signature or not secret:
        return False
    if not hub_signature.startswith("sha256="):
        return False
    
    expected = hmac.new(secret.encode("utf-8"), payload_body, hashlib.sha256).hexdigest()
    actual = hub_signature[7:]
    return hmac.compare_digest(expected, actual)

# --- Secret Masking & Sensitive Log Sanitizer (DevSecOps) ---
SECRET_REGEX_PATTERNS = [
    r"(?i)(AKIA[0-9A-Z]{16})",                       # AWS Access Key ID
    r"(?i)(ghp_[0-9a-zA-Z]{36})",                    # GitHub Personal Access Token
    r"(?i)(glpat-[0-9a-zA-Z\-_]{20})",               # GitLab PAT
    r"(?i)(AIza[0-9A-Za-z\-_]{35})",                 # Google API Key
    r"(?i)(bearer\s+[a-zA-Z0-9\-_]{20,})",           # Bearer Tokens
    r"(?i)(password\s*[:=]\s*['\"][^'\"]+['\"])",     # Plaintext passwords
    r"(?i)(secret\s*[:=]\s*['\"][^'\"]+['\"])",       # Plaintext secrets
]

def mask_sensitive_data(log_text: str) -> str:
    """Masks secrets and API keys from logs to prevent leakage in audit trails."""
    masked = log_text
    for pattern in SECRET_REGEX_PATTERNS:
        masked = re.sub(pattern, "[MASKED_SECRET]", masked)
    return masked
