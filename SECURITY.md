# CloudOps AI 2.0: Enterprise Security & DevSecOps Specification

**Classification:** Restricted / DevSecOps Standard Operating Procedure  
**Version:** 2.0.0  
**Compliance Target:** CIS AWS Foundations Benchmark, SOC 2 Type II, ISO/IEC 27001  

---

## 1. Security Philosophy & Zero-Trust Principles

CloudOps AI 2.0 adheres to the **Principle of Least Privilege (PoLP)** and **Zero-Trust Architecture**:
1. **No Long-Lived Static Credentials:** Storing AWS Access Keys or API keys in code or GitHub Secrets is strictly forbidden. Authentication leverages OpenID Connect (OIDC) federated STS tokens.
2. **Shift-Left Security:** Vulnerabilities, secret exposures, and IaC misconfigurations must be detected and blocked in pre-commit and pre-deployment gates before code reaches production infrastructure.
3. **Defense in Depth:** Security is applied across 7 continuous layers: source code analysis, unit testing, secret scanning, container hardening, infrastructure policy, dynamic runtime probing, and human-in-the-loop approval.
4. **Autonomous Action Allowlisting:** AI agents are never permitted to execute arbitrary shell commands. Autonomous healing is restricted to validated, non-destructive, parameter-checked Kubernetes APIs.

---

## 2. DevSecOps Multi-Stage Security Pipeline

```
[Source Code] ──> [Stage 1: SonarQube] ──> [Stage 2: Pytest] ──> [Stage 3: Gitleaks]
                                                                        ↓
[Production EKS] <── [Gatekeeper Review] <── [Stage 6: OWASP ZAP] <── [Stage 5: Checkov] <── [Stage 4: Trivy]
```

### Stage 1: Static Code Analysis (SonarQube)
- Enforces code maintainability, cognitive complexity limits, and automated bug detection.
- **Security Gate Policy:** Code Coverage ≥ 80%, Maintainability Rating A, 0 Bugs, 0 Vulnerabilities.

### Stage 2: Automated Test Matrix (Pytest)
- Validates API input sanitation, schema integrity, and Kubernetes YAML syntax.
- **Security Gate Policy:** 100% test pass rate across all 42 automated tests.

### Stage 3: High-Entropy Secret Detection (Gitleaks)
- Scans all files and commit diffs using regular expressions targeting:
  - AWS Access Keys (`AKIA[0-9A-Z]{16}`)
  - GitHub Personal Access Tokens (`ghp_[0-9a-zA-Z]{36}`)
  - Google Gemini API Keys (`AIza[0-9A-Za-z\-_]{35}`)
  - Bearer tokens, private keys (`BEGIN RSA PRIVATE KEY`), and database connection passwords.
- **Security Gate Policy:** Zero secrets allowed. In logs and telemetry, detected tokens are replaced with `[MASKED_SECRET]` to prevent leakages in audit trails.

### Stage 4: Container Vulnerability Scanning (Trivy)
- Inspects container base OS layers and application package dependencies against the national vulnerability database (NVD).
- **Security Gate Policy:** Blocks rollout if Critical CVEs > 0 or High CVEs > 2.

### Stage 5: Infrastructure as Code Compliance (Checkov)
- Evaluates Terraform modules and Kubernetes manifests against 27 CIS benchmarks:
  - `CKV_AWS_20`: Mandatory AWS KMS encryption for private S3 and ECR assets.
  - `CKV_AWS_130`: Mandatory VPC Flow Logs enabled with CloudWatch aggregation.
  - `CKV_K8S_40`: Mandatory enforcement of unprivileged non-root users (`USER 10001:10001`).
  - `CKV_K8S_14`: Mandatory CPU and memory request/limit definitions on all container pods.

### Stage 6: Dynamic Application Security Testing (OWASP ZAP)
- Probes running web applications for baseline HTTP headers:
  - `Content-Security-Policy` (CSP)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security` (HSTS)

### Stage 7: Deployment Security Gate & Exception Overrides
- When all 6 stages pass, the deployment is automatically approved.
- If a security gate blocks a deployment, only an authenticated user with the `security_admin` role can review and override the block, creating an immutable audit log entry.

---

## 3. Human-in-the-Loop Auto-Healing Guardrails

To prevent autonomous AI agents from causing catastrophic infrastructure destruction, CloudOps AI 2.0 enforces three critical guardrails:

1. **Strict Action Allowlist:** The AI agent can only propose actions from a strictly verified set:
   - `restart_pod`: Restarts a container with excessive restarts.
   - `increase_resource_limits`: Patches memory limits (up to a hard ceiling of 2Gi).
   - `scale_deployment`: Adjusts replica counts between 1 and 10.
   - `rollback_deployment`: Executes `kubectl rollout undo` to a previous revision.
   - `switch_blue_green`: Atomic selector change between Blue and Green.
2. **Approval Expiration (TTL):** Proposed recovery action cards expire after 15 minutes. Expired actions cannot be executed.
3. **Mandatory Post-Recovery Health Verification:** Following execution, the platform tests pod readiness probes and HTTP `/healthz` endpoints. If degraded, it alerts SRE on-call engineers via Slack and AWS SNS.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Action / Capability | Viewer | DevOps Engineer | Security Admin | Platform Admin |
|---|---|---|---|---|
| View Dashboards & Telemetry | ✓ | ✓ | ✓ | ✓ |
| Trigger CI/CD Pipelines | ✗ | ✓ | ✗ | ✓ |
| Deploy via Blue-Green / Canary | ✗ | ✓ | ✗ | ✓ |
| Approve Auto-Healing Recoveries | ✗ | ✓ | ✗ | ✓ |
| Override DevSecOps Security Gates | ✗ | ✗ | ✓ | ✓ |
| Execute Terraform Infrastructure Apply | ✗ | ✗ | ✗ | ✓ |
| Manage User Roles & Permissions | ✗ | ✗ | ✗ | ✓ |

---

## 5. Security Incident Reporting

To report a vulnerability or security vulnerability in CloudOps AI, contact `security@cloudops.internal` or open an encrypted advisory in GitHub Security Center.

