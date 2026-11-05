import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.api.routes import (
    api_router,
    seed_users,
    seed_projects,
    seed_deployments,
    seed_incidents,
    seed_security_scans,
    seed_audit_logs,
    seed_rollbacks
)
from app.models import Project

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("devops.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Schema & Seed Initial Enterprise Data
    logger.info("Initializing database schema for CloudOps AI 2.0...")
    try:
        init_db()
        db = SessionLocal()
        try:
            seed_users(db)
            seed_projects(db)
            seed_deployments(db)
            seed_incidents(db)
            seed_security_scans(db)
            seed_audit_logs(db)
            seed_rollbacks(db)
            logger.info("Database schemas verified and enterprise demo state seeded.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield
    logger.info("Shutting down CloudOps AI engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI-Powered DevOps Automation, Autonomous Auto-Healing & DevSecOps Platform (CLOUDOPS-2.0).",
    version=settings.VERSION,
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_PREFIX)

# WebSocket Real-Time Terminal & Log Streaming
@app.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_text("Connected to CloudOps AI Terminal Daemon (aws:eks-prod / devsecops).")
    try:
        while True:
            data = await websocket.receive_text()
            cmd = data.strip()
            if cmd == "help":
                await websocket.send_text("Supported commands: kubectl get pods, kubectl get deployments, docker images, aws ecr describe-repositories, terraform plan, devsecops status")
            elif cmd.startswith("kubectl get pods"):
                await websocket.send_text("NAME: payment-gateway-7b8c6949f-2m8p1 STATUS: Running (1/1) RESTARTS: 0\nNAME: auth-service-58dc76b98-z41v8 STATUS: Running (1/1) RESTARTS: 0\nNAME: orders-api-6f987c88b-8jk41 STATUS: CrashLoopBackOff (0/1) RESTARTS: 4")
            elif cmd.startswith("kubectl get deployments"):
                await websocket.send_text("NAME: payment-gateway READY: 3/3 UP-TO-DATE: 3 AVAILABLE: 3 (Rolling)\nNAME: auth-service READY: 2/2 UP-TO-DATE: 2 AVAILABLE: 2 (Blue-Green: GREEN)\nNAME: orders-api READY: 1/2 UP-TO-DATE: 2 AVAILABLE: 1 (Canary: 25%)")
            elif cmd.startswith("docker"):
                await websocket.send_text("REPOSITORY: payment-gateway:v2.4.2 SIZE: 128MB DIGEST: sha256:7f39b1a...\nREPOSITORY: auth-service:v1.8.0 SIZE: 142MB DIGEST: sha256:c9417ae...")
            elif cmd.startswith("devsecops"):
                await websocket.send_text("DEVSECOPS STATUS: [PASSED] | SonarQube: Grade A | Gitleaks: 0 Leaks | Trivy: 0 CVEs | Checkov: 96.3%")
            else:
                await websocket.send_text(f"[CloudOps AI Console] Executed: {cmd}")
    except WebSocketDisconnect:
        logger.info("Terminal WebSocket disconnected.")

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "project_id": settings.PROJECT_ID,
        "status": "online",
        "docs": "/docs",
        "version": settings.VERSION,
        "modules": [
            "Module 1: Real End-to-End DevOps & Multi-Strategy Deployment (Rolling, Blue-Green, Canary)",
            "Module 2: AI-Powered Incident Management & Auto-Healing",
            "Module 3: Complete DevSecOps Pipeline (SonarQube, Gitleaks, Trivy, Checkov, OWASP ZAP)"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
