#!/usr/bin/env python3
"""
CRAFTORA Unified Launcher.
Starts both the FastAPI Backend (Port 8000) and Frontend Node Server (Port 3456)
with a single command and opens the application in your browser.
"""

import os
import sys
import subprocess
import time
import webbrowser
import signal

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_UVICORN = os.path.join(ROOT_DIR, "venv", "bin", "uvicorn")
if not os.path.exists(VENV_UVICORN):
    VENV_UVICORN = "uvicorn"

print("\n" + "=" * 60)
print("  🎨 STARTING CRAFTORA (Backend + Frontend Combined)  ")
print("=" * 60)

# 1. Start FastAPI Backend on Port 8000
print("\n[1/2] 🚀 Starting FastAPI Backend on http://localhost:8000 ...")
backend_cmd = [VENV_UVICORN, "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
backend_proc = subprocess.Popen(backend_cmd, cwd=ROOT_DIR)

# 2. Start Frontend Server on Port 3456
print("[2/2] 🌐 Starting Frontend Server on http://localhost:3456 ...")
frontend_cmd = ["node", "server.js"]
frontend_proc = subprocess.Popen(frontend_cmd, cwd=ROOT_DIR)

time.sleep(1.5)

print("\n" + "=" * 60)
print("  ✅ BOTH SERVICES ARE ACTIVE & CONNECTED!")
print("  • Frontend App: http://localhost:3456/")
print("  • Backend API:  http://localhost:8000/api")
print("  • Swagger Docs: http://localhost:8000/docs")
print("=" * 60)
print("  Press Ctrl+C anytime to stop both servers cleanly.\n")

try:
    webbrowser.open("http://localhost:3456/")
except Exception:
    pass

def cleanup(sig=None, frame=None):
    print("\n🛑 Shutting down CRAFTORA servers cleanly...")
    try:
        backend_proc.terminate()
        frontend_proc.terminate()
    except Exception:
        pass
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

try:
    while True:
        time.sleep(1)
        if backend_proc.poll() is not None or frontend_proc.poll() is not None:
            break
except KeyboardInterrupt:
    cleanup()
