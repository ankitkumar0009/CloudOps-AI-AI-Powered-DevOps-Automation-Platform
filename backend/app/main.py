import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.api.routes import api_router, seed_projects, seed_rollbacks
from app.models import Project

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("devops.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database Schema & Seed Data
    logger.info("Initializing database schema...")
    try:
        init_db()
        db = SessionLocal()
        try:
            if db.query(Project).count() == 0:
                logger.info("Database is empty. Seeding initial DevOps projects and workloads...")
                seed_projects(db)
                seed_rollbacks(db)
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield
    logger.info("Shutting down CloudOps AI engine...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Production-inspired, end-to-end AI-Powered DevOps Automation Platform (DEVOPS-001).",
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
    await websocket.send_text("Connected to CloudOps AI Terminal Daemon (aws:eks-prod).")
    try:
        while True:
            data = await websocket.receive_text()
            cmd = data.strip()
            if cmd == "help":
                await websocket.send_text("Commands: kubectl get pods, docker ps, terraform plan")
            elif cmd.startswith("kubectl"):
                await websocket.send_text("NAME: payment-gateway-7b8c6949f-2m8p1 STATUS: Running RESTARTS: 0")
            elif cmd.startswith("docker"):
                await websocket.send_text("CONTAINER ID: 9f82c7a10b42 IMAGE: payment-gateway:v2.4.2 STATUS: Up 2 hours")
            else:
                await websocket.send_text(f"[Echo] Executed: {cmd}")
    except WebSocketDisconnect:
        logger.info("Terminal WebSocket disconnected.")

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "project_id": settings.PROJECT_ID,
        "status": "online",
        "docs": "/docs",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
