# CloudOps AI 2.0: Enterprise Deployment & Operations Guide

This guide provides step-by-step instructions for deploying CloudOps AI 2.0 across three environments:
1. **Local Development (Zero-Cloud Mode with SQLite & In-Memory Cluster)**
2. **Containerized Multi-Service Deployment (Docker Compose)**
3. **Cloud Production Deployment (Amazon EKS, AWS ECR, and Terraform)**

---

## 1. Prerequisites

| Component | Minimum Version | Verified Version | Purpose |
|---|---|---|---|
| **Python** | 3.11+ | 3.11.9 | Platform backend & AI agent runtime |
| **Node.js** | 18+ | 25.8.1 | React + Vite dashboard frontend |
| **Docker** | 20.10+ | 29.6.2 | Container build & orchestration |
| **Terraform** | 1.5+ | 1.14.7 | Declarative Infrastructure as Code |
| **kubectl** | 1.28+ | 1.29.0 | Kubernetes cluster command line |

---

## 2. Option A: Local Development Setup (Recommended for Quickstart)

The platform includes an embedded Python environment and automatic fallback to local SQLite so you can test all features without requiring active AWS credentials.

### Step 1: Clone Repository & Configure Environment
```bash
git clone <repository-url>
cd "PROJECT AI-POWERED DEVOPS AUTOMATION PLATFORM"
cp .env.example .env
```

### Step 2: Launch All 4 Platform Tiers with the Unified Launcher
Run the unified platform launcher script:
```bash
.\.python\python.exe run_platform.py
```

The launcher will verify and connect:
1. **Frontend Dashboard UI:** `http://localhost:3000`
2. **FastAPI Backend Automation API:** `http://127.0.0.1:8000/api/health`
3. **Interactive Swagger Documentation:** `http://127.0.0.1:8000/docs`
4. **Prometheus Telemetry Scraper:** `http://localhost:9090`
5. **Grafana Observability Portal:** `http://localhost:3001` (Credentials: `admin`/`admin`)

---

## 3. Option B: Full-Stack Docker Compose Deployment

To run all microservices inside isolated production containers:

```bash
cd docker
docker compose up --build -d
```

### Inspected Services:
- `devops-postgres`: PostgreSQL 16 database (`port 5432`)
- `devops-backend`: FastAPI automation engine (`port 8000`)
- `devops-frontend`: Nginx-served production React dashboard (`port 3000`)
- `devops-prometheus`: Prometheus metrics scraper (`port 9090`)
- `devops-grafana`: Grafana dashboard portal (`port 3001`)

To stop the containers:
```bash
docker compose down
```

---

## 4. Option C: Amazon EKS Production Rollout

### Step 1: Provision Infrastructure via Terraform
```bash
cd terraform
terraform init
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```
This provisions:
- AWS VPC with 2 public subnets, 2 private subnets, Internet Gateway, and NAT Gateway.
- Amazon EKS Cluster v1.29 with managed worker node groups.
- Amazon ECR private repository with KMS AES256 encryption.
- Zero-trust GitHub Actions IAM OIDC identity provider and role.

### Step 2: Configure kubectl Context for EKS
```bash
aws eks update-kubeconfig --region us-east-1 --name eks-prod-cluster
```

### Step 3: Apply Declarative Kubernetes Manifests
```bash
# 1. Create the platform namespace
kubectl apply -f kubernetes/namespace.yaml

# 2. Deploy backend, frontend, and cluster services
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/deployment.yaml

# 3. Verify pod health across nodes
kubectl get pods -n cloudops-devops -o wide
```

---

## 5. Deployment Strategies Operational Runbook

### Strategy 1: Triggering a Rolling Update
```bash
kubectl set image deployment/payment-gateway payment-gateway=123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-gateway:v2.4.2 -n production
kubectl rollout status deployment/payment-gateway -n production
```

### Strategy 2: Executing a Zero-Downtime Blue-Green Switch
1. Deploy new container image to the green deployment:
   ```bash
   kubectl set image deployment/auth-service-green auth-service=auth-service:v1.8.0 -n production
   ```
2. Verify green pod health and readiness:
   ```bash
   kubectl get pods -l app=auth-service,color=green -n production
   ```
3. Update Service selector to switch live traffic to Green:
   ```bash
   kubectl patch service auth-service-svc -p '{"spec":{"selector":{"color":"green"}}}' -n production
   ```
4. If issues occur, instantaneously revert back to Blue:
   ```bash
   kubectl patch service auth-service-svc -p '{"spec":{"selector":{"color":"blue"}}}' -n production
   ```

### Strategy 3: Conducting a Canary Deployment
1. Deploy baseline (e.g. 75% traffic) and canary (25% traffic):
   ```bash
   kubectl scale deployment/orders-api-primary --replicas=3 -n staging
   kubectl scale deployment/orders-api-canary --replicas=1 -n staging
   ```
2. Inspect Prometheus P99 latency percentiles and error metrics on port 9090.
3. Promote canary to 100% upon metric satisfaction:
   ```bash
   kubectl set image deployment/orders-api-primary orders-api=orders-api:v3.1.0 -n staging
   kubectl scale deployment/orders-api-canary --replicas=0 -n staging
   ```

---

## 6. SRE Automated Rollback Runbook

If a deployment rollout fails due to `CrashLoopBackOff`, `OOMKilled`, or readiness probe timeouts, execute a rollback to the previous revision:

```bash
# Check rollout revision history
kubectl rollout history deployment/payment-gateway -n production

# Undo rollout to previous stable revision
kubectl rollout undo deployment/payment-gateway -n production

# Undo rollout to a specific target revision
kubectl rollout undo deployment/payment-gateway -n production --to-revision=2
```

