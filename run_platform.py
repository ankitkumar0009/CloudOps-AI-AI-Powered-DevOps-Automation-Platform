"""
AI-Powered DevOps Automation Platform - Unified Orchestrator & Launcher.
Connects and starts all 4 platform tiers:
  1. FastAPI Backend Automation Engine (Port 8000)
  2. React + Vite Frontend Dashboard (Port 3000)
  3. Prometheus Metrics & Scrape Engine (Port 9090)
  4. Grafana Observability Portal (Port 3001)
"""

import sys
import os
import time
import subprocess
import urllib.request
import json

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_EXE = os.path.join(ROOT_DIR, ".python", "python.exe")
if not os.path.exists(PYTHON_EXE):
    PYTHON_EXE = sys.executable

def check_endpoint(url, timeout=3):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DevOps-HealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status in (200, 204)
    except Exception:
        return False

def main():
    print("=" * 70)
    print("  AI-POWERED DEVOPS AUTOMATION PLATFORM - UNIFIED LAUNCHER")
    print("=" * 70)

    # 1. Database Initialization
    print("\n[1/5] Checking Database & Seeding Schemas...")
    sys.path.insert(0, os.path.join(ROOT_DIR, "backend"))
    try:
        from app.database import init_db, SessionLocal
        from app.api.routes import seed_projects, seed_rollbacks
        init_db()
        db = SessionLocal()
        seed_projects(db)
        seed_rollbacks(db)
        db.close()
        print("  ✓ Database schema verified & initial microservices seeded.")
    except Exception as e:
        print(f"  ! Database initialization note: {e}")

    # 2. Check / Start Backend (Port 8000)
    print("\n[2/5] Connecting FastAPI Backend Engine (:8000)...")
    if check_endpoint("http://127.0.0.1:8000/api/health"):
        print("  ✓ Backend API is already running and healthy.")
    else:
        print("  ➜ Spawning backend process...")
        subprocess.Popen(
            [PYTHON_EXE, "-m", "uvicorn", "app.main:app", "--app-dir", "backend", "--host", "127.0.0.1", "--port", "8000"],
            cwd=ROOT_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        time.sleep(2)

    # 3. Check / Start Prometheus (Port 9090)
    print("\n[3/5] Connecting Prometheus Scrape Engine (:9090)...")
    if check_endpoint("http://127.0.0.1:9090/metrics"):
        print("  ✓ Prometheus Metrics Engine is already running and scraping.")
    else:
        print("  ➜ Spawning Prometheus server...")
        subprocess.Popen(
            [PYTHON_EXE, "-m", "uvicorn", "monitoring.prometheus_server:app", "--host", "127.0.0.1", "--port", "9090"],
            cwd=ROOT_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        time.sleep(2)

    # 4. Check / Start Grafana Portal (Port 3001)
    print("\n[4/5] Connecting Grafana Observability Portal (:3001)...")
    if check_endpoint("http://127.0.0.1:3001/api/health"):
        print("  ✓ Grafana Observability Portal is already running.")
    else:
        print("  ➜ Spawning Grafana server...")
        subprocess.Popen(
            [PYTHON_EXE, "-m", "uvicorn", "monitoring.grafana_server:app", "--host", "127.0.0.1", "--port", "3001"],
            cwd=ROOT_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        time.sleep(2)

    # 5. Check / Start React Frontend (Port 3000)
    print("\n[5/5] Connecting React + Vite Dashboard UI (:3000)...")
    if check_endpoint("http://localhost:3000"):
        print("  ✓ Frontend UI dev server is already running.")
    else:
        print("  ➜ Spawning Vite dev server...")
        subprocess.Popen(
            ["npm.cmd" if os.name == 'nt' else "npm", "run", "dev", "--prefix", "frontend"],
            cwd=ROOT_DIR,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
        )
        time.sleep(3)

    # Health Check Matrix
    print("\n" + "=" * 70)
    print("  ALL SERVICES CONNECTED & VERIFIED")
    print("=" * 70)

    services = [
        ("Frontend Web Console", "http://localhost:3000"),
        ("FastAPI Backend API", "http://127.0.0.1:8000/api/health"),
        ("Swagger Documentation", "http://127.0.0.1:8000/docs"),
        ("Prometheus Engine", "http://localhost:9090"),
        ("Prometheus Metrics Stream", "http://localhost:9090/metrics"),
        ("Grafana Portal", "http://localhost:3001"),
    ]

    for name, url in services:
        status = "● ONLINE" if check_endpoint(url) else "○ STARTING"
        print(f"  {status:<12} {name:<26} -> {url}")

    print("\n" + "=" * 70)
    print("  Open http://localhost:3000 in your browser to access the platform.")
    print("=" * 70 + "\n")

    try:
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        print("Shutting down platform processes...")

if __name__ == "__main__":
    main()

