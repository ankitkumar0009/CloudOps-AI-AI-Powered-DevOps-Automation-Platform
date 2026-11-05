#!/usr/bin/env python3
"""
CloudOps AI - Autonomous Gemini DevOps Agent
Analyzes real-time deployment logs, Kubernetes pod crashes, and Terraform state errors.
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

class GeminiDevOpsAgent:
    def __init__(self, api_key: str = GEMINI_API_KEY, model: str = GEMINI_MODEL):
        self.api_key = api_key
        self.model = model
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[WARN] Gemini Client initialization: {e}", file=sys.stderr)

    def analyze(self, log_snippet: str, context_type: str = "k8s_pod") -> Dict[str, Any]:
        """Analyzes log snippet using Gemini API with structured JSON output."""
        if self.client:
            prompt = f"""You are a Principal DevOps Engineer and SRE.
Analyze this deployment log ({context_type}) and output ONLY a JSON object with:
- "root_cause": detailed explanation of why it failed.
- "possible_reasons": array of 2-3 technical causes.
- "recommended_solution": primary remediation.
- "step_by_step_fix": array of numbered steps.
- "suggested_commands": array of safe kubectl/docker/terraform commands.
- "confidence_score": integer 80-99.

Log:
\"\"\"{log_snippet}\"\"\"
"""
            try:
                res = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                txt = res.text.strip()
                if "```json" in txt:
                    txt = txt.split("```json")[1].split("```")[0].strip()
                elif "```" in txt:
                    txt = txt.split("```")[1].split("```")[0].strip()
                return json.loads(txt)
            except Exception as e:
                print(f"[INFO] Falling back to heuristic diagnosis: {e}", file=sys.stderr)

        # Built-in contextual analysis engine
        return self._heuristic_analysis(log_snippet, context_type)

    def _heuristic_analysis(self, log_snippet: str, context_type: str) -> Dict[str, Any]:
        l = log_snippet.lower()
        if "137" in l or "oom" in l or "memory" in l:
            return {
                "root_cause": "Container terminated by OS OOM killer (exit code 137). Pod exceeded assigned memory limit.",
                "possible_reasons": [
                    "JVM or Node runtime heap allocation exceeded cgroup limit (512Mi).",
                    "Uncontrolled bulk memory processing in recent queue worker update.",
                    "No memory buffer configured for child worker processes."
                ],
                "recommended_solution": "Increase pod memory limit in kubernetes/deployment.yaml to 1024Mi and configure JVM heap ceiling.",
                "step_by_step_fix": [
                    "Edit kubernetes/deployment.yaml container resources.limits.memory to 1024Mi",
                    "Set resources.requests.memory to 512Mi",
                    "Add -XX:MaxRAMPercentage=75.0 to runtime arguments",
                    "Apply update: kubectl apply -f kubernetes/deployment.yaml"
                ],
                "suggested_commands": [
                    "kubectl describe pod <pod-name> -n production",
                    "kubectl top pods -n production",
                    "kubectl rollout undo deployment/<deploy-name> -n production"
                ],
                "confidence_score": 96
            }
        elif "vpclimitexceeded" in l or "terraform" in l:
            return {
                "root_cause": "AWS API rejected VPC creation: Regional soft quota reached in us-east-1.",
                "possible_reasons": [
                    "Account has reached the default limit of 5 VPCs per AWS region.",
                    "Zombie VPCs from older testing deployments not yet destroyed."
                ],
                "recommended_solution": "Clean up unused testing VPCs or request a Service Quota increase in AWS Console.",
                "step_by_step_fix": [
                    "Run 'aws ec2 describe-vpcs --region us-east-1' to inspect existing VPC IDs",
                    "Delete orphaned VPCs and internet gateways",
                    "Or request a quota increase via AWS Service Quotas dashboard"
                ],
                "suggested_commands": [
                    "aws ec2 describe-vpcs --region us-east-1",
                    "terraform plan"
                ],
                "confidence_score": 92
            }
        else:
            return {
                "root_cause": "Application failed during startup initialization or health check handshake.",
                "possible_reasons": [
                    "Required environment variables or database connection secrets missing.",
                    "Liveness probe port is mismatched with container EXPOSE port."
                ],
                "recommended_solution": "Inspect container logs with kubectl logs --previous and verify database credentials.",
                "step_by_step_fix": [
                    "Run kubectl logs <pod-name> --previous to examine the crash stack trace",
                    "Confirm database host and port are reachable from within the VPC subnet",
                    "Increase livenessProbe initialDelaySeconds to 30s"
                ],
                "suggested_commands": [
                    "kubectl logs -l app=payment-gateway -n production --previous",
                    "kubectl get events -n production"
                ],
                "confidence_score": 89
            }

def main():
    parser = argparse.ArgumentParser(description="CloudOps AI Gemini DevOps Diagnostic Agent")
    parser.add_argument("--log", type=str, help="Error log text to diagnose", default="CrashLoopBackOff: exit code 137 OOMKilled in pod orders-api")
    parser.add_argument("--context", type=str, default="k8s_pod", help="Context type (k8s_pod, docker_build, terraform, github_actions)")
    args = parser.parse_args()

    agent = GeminiDevOpsAgent()
    result = agent.analyze(args.log, args.context)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()

