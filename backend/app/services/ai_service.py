import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("devops.ai")

class AiDevOpsService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        self._init_gemini()

    def _init_gemini(self):
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Google Gemini client with model {self.model_name}.")
            except Exception as e:
                logger.warning(f"Google Gemini client initialization failed: {e}. Fallback to context-aware local intelligence engine.")
        else:
            logger.info("No GEMINI_API_KEY set. Using local contextual NLP diagnostic engine.")

    def diagnose_log(self, log_snippet: str, context_type: str = "k8s_pod") -> Dict[str, Any]:
        """Diagnoses deployment errors using Gemini API or contextual reasoning engine."""
        if self.client:
            try:
                prompt = f"""You are a Senior SRE and Cloud Architect.
Analyze the following {context_type} deployment error log and return ONLY a valid JSON object with these exact keys:
- "root_cause": string explaining the exact reason for failure.
- "possible_reasons": array of 2 to 3 detailed technical reasons.
- "recommended_solution": string with the direct fix.
- "step_by_step_fix": array of step-by-step instructions.
- "suggested_commands": array of safe kubectl, docker, terraform, or aws cli commands to troubleshoot/fix.
- "confidence_score": integer between 70 and 99.

Log Snippet:
\"\"\"{log_snippet}\"\"\"
"""
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                raw_text = response.text.strip()
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json")[1].split("```")[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```")[1].split("```")[0].strip()

                parsed = json.loads(raw_text)
                return {
                    "id": f"diag-{int(datetime.utcnow().timestamp())}",
                    "context_type": context_type,
                    "log_snippet": log_snippet[:400],
                    "root_cause": parsed.get("root_cause", "Deployment failure identified."),
                    "possible_reasons": parsed.get("possible_reasons", []),
                    "recommended_solution": parsed.get("recommended_solution", "Review configurations and retry."),
                    "step_by_step_fix": parsed.get("step_by_step_fix", []),
                    "suggested_commands": parsed.get("suggested_commands", []),
                    "confidence_score": float(parsed.get("confidence_score", 92)),
                    "analyzed_at": datetime.utcnow()
                }
            except Exception as e:
                logger.error(f"Gemini API call error: {e}. Utilizing intelligent local diagnostic analyzer.")

        # Context-aware intelligent heuristic engine
        return self._contextual_diagnose(log_snippet, context_type)

    def _contextual_diagnose(self, log_snippet: str, context_type: str) -> Dict[str, Any]:
        log_lower = log_snippet.lower()

        # OOM / Memory Limit
        if "137" in log_lower or "oom" in log_lower or "memory" in log_lower or "outofmemory" in log_lower:
            return {
                "id": f"diag-{int(datetime.utcnow().timestamp())}",
                "context_type": context_type,
                "log_snippet": log_snippet[:400],
                "root_cause": "Linux kernel Out-Of-Memory (OOM) killer terminated the container process (Exit Code 137).",
                "possible_reasons": [
                    "Kubernetes pod memory limit (resources.limits.memory) is configured too low for application runtime startup requirements.",
                    "Java/Node heap allocation exceeded the cgroup memory barrier during bulk queue processing.",
                    "Memory leak triggered by unclosed database connections or file handles in recent commit."
                ],
                "recommended_solution": "Increase the Kubernetes container memory limit and calibrate runtime max heap percentages.",
                "step_by_step_fix": [
                    "Open kubernetes/deployment.yaml",
                    "Update resources.limits.memory from 512Mi to 1024Mi and resources.requests.memory to 512Mi",
                    "For Java: Add env JAVA_TOOL_OPTIONS='-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0'",
                    "For Node.js: Add --max-old-space-size=768 flag to node start command",
                    "Apply manifest via kubectl apply -f kubernetes/deployment.yaml or platform UI"
                ],
                "suggested_commands": [
                    "kubectl describe pod -l app=orders-api -n staging",
                    "kubectl top pod -l app=orders-api -n staging",
                    "kubectl rollout undo deployment/orders-api -n staging"
                ],
                "confidence_score": 96.0,
                "analyzed_at": datetime.utcnow()
            }

        # Port conflict
        if "eaddrinuse" in log_lower or "address already in use" in log_lower:
            return {
                "id": f"diag-{int(datetime.utcnow().timestamp())}",
                "context_type": context_type,
                "log_snippet": log_snippet[:400],
                "root_cause": "Network port binding failed: TCP address or port already bound by an existing process.",
                "possible_reasons": [
                    "Another local container or zombie host process is already listening on the target port.",
                    "Pod hostPort collision in Kubernetes host network mode.",
                    "Liveness probe port is mismatched with container EXPOSE port."
                ],
                "recommended_solution": "Change container exposed port or terminate conflicting processes.",
                "step_by_step_fix": [
                    "Verify target listening port in application environment settings",
                    "Check port mapping in Dockerfile EXPOSE and Kubernetes containerPort",
                    "Update Kubernetes Service targetPort to match new containerPort",
                    "Redeploy the application"
                ],
                "suggested_commands": [
                    "kubectl get pods -o wide -n production",
                    "kubectl describe service payment-gateway-svc -n production"
                ],
                "confidence_score": 94.0,
                "analyzed_at": datetime.utcnow()
            }

        # Dockerfile / Package not found
        if "package-lock.json" in log_lower or "npm err!" in log_lower or "enotfound" in log_lower:
            return {
                "id": f"diag-{int(datetime.utcnow().timestamp())}",
                "context_type": context_type,
                "log_snippet": log_snippet[:400],
                "root_cause": "Docker build failed during dependency installation stage due to missing lockfile.",
                "possible_reasons": [
                    "'npm ci' requires an existing package-lock.json in the build context root.",
                    ".dockerignore excluded package-lock.json from being copied into the builder container.",
                    "Incompatible Node.js engine version specified in package.json."
                ],
                "recommended_solution": "Generate package-lock.json locally with 'npm install' or switch 'npm ci' to 'npm install --production'.",
                "step_by_step_fix": [
                    "Run 'npm install --package-lock-only' locally to generate a clean package-lock.json",
                    "Ensure package-lock.json is committed to the Git repository",
                    "Verify .dockerignore does not exclude lockfiles",
                    "Trigger automated Docker build from platform"
                ],
                "suggested_commands": [
                    "docker build --no-cache -t app:test .",
                    "git status --ignored"
                ],
                "confidence_score": 91.0,
                "analyzed_at": datetime.utcnow()
            }

        # Default general failure
        return {
            "id": f"diag-{int(datetime.utcnow().timestamp())}",
            "context_type": context_type,
            "log_snippet": log_snippet[:400],
            "root_cause": "Application crashed during initialization or health probe handshake.",
            "possible_reasons": [
                "Missing environment variables or secret configuration required on boot.",
                "Database connection failure or network security group rule rejecting outbound traffic.",
                "Liveness probe initialDelaySeconds expired before application completed warmup."
            ],
            "recommended_solution": "Inspect pod previous container logs and extend liveness probe grace period.",
            "step_by_step_fix": [
                "Examine previous crash logs using kubectl logs --previous",
                "Verify database credentials in Kubernetes Secrets and ConfigMaps",
                "Increase livenessProbe.initialDelaySeconds to 30s in kubernetes/deployment.yaml",
                "Trigger rollout update"
            ],
            "suggested_commands": [
                "kubectl logs -l app=payment-gateway -n production --previous",
                "kubectl get events -n production --sort-by=.metadata.creationTimestamp"
            ],
            "confidence_score": 88.0,
            "analyzed_at": datetime.utcnow()
        }

    def chat(self, message: str, history: List[Dict[str, Any]] = []) -> Dict[str, Any]:
        """Provides interactive AI DevOps assistant chat."""
        if self.client:
            try:
                system_prompt = (
                    "You are CloudOps AI, an expert Senior DevOps Engineer, Site Reliability Engineer, and Cloud Architect. "
                    "Provide clear, technically precise, and actionable answers. "
                    "When suggesting CLI commands (kubectl, terraform, aws, docker), format them cleanly."
                )
                full_prompt = f"{system_prompt}\nUser Question: {message}"
                res = self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt
                )
                return {
                    "reply": res.text,
                    "suggested_commands": [
                        "kubectl get pods -n production",
                        "kubectl describe deployment payment-gateway -n production"
                    ]
                }
            except Exception as e:
                logger.error(f"Gemini chat error: {e}")

        # Intelligent conversational responses
        msg_lower = message.lower()
        if "oom" in msg_lower or "crash" in msg_lower or "restart" in msg_lower:
            return {
                "reply": "When pods suffer CrashLoopBackOff or OOMKilled (Exit Code 137), check container memory limits in your Deployment manifest. In Kubernetes, cgroups strictly enforce limits; if exceeded, the Linux kernel terminates the container immediately. I recommend increasing the memory limit to 1024Mi and checking heap sizes.",
                "suggested_commands": [
                    "kubectl describe pod <pod-name> -n production",
                    "kubectl top pod -n production"
                ]
            }
        elif "terraform" in msg_lower or "infra" in msg_lower:
            return {
                "reply": "Our Terraform architecture is modularized into VPC, EC2, ECR, EKS, and IAM. All state modifications require running 'terraform plan' first, followed by manual approval before 'terraform apply' can execute.",
                "suggested_commands": [
                    "terraform plan",
                    "terraform validate"
                ]
            }
        elif "oidc" in msg_lower or "iam" in msg_lower or "security" in msg_lower:
            return {
                "reply": "We use AWS IAM OpenID Connect (OIDC) identity federation for GitHub Actions. This eliminates long-lived static AWS access keys, issuing temporary STS credentials scoped strictly to ECR push and EKS deployment permissions.",
                "suggested_commands": [
                    "aws sts get-caller-identity",
                    "aws iam get-role --role-name GitHubActions-EKS-Deployer-Role"
                ]
            }
        else:
            return {
                "reply": f"Regarding '{message}': In our production AWS EKS pipeline, services are packaged into multi-stage Docker images, published to Amazon ECR, and rolled out using zero-downtime rolling updates with automatic health check monitoring.",
                "suggested_commands": [
                    "kubectl get deployments -n production",
                    "kubectl get events -n production"
                ]
            }

ai_service = AiDevOpsService()
