import os
import sys
import time
import atexit
import signal
import subprocess
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

# Add backend directory to sys.path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config import PORT, HOST

vite_process = None

def cleanup():
    global vite_process
    if vite_process:
        print("\n[INFO] Shutting down Vite frontend server...")
        try:
            # Terminate child process tree cleanly on Windows
            if sys.platform == "win32":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(vite_process.pid)],
                    capture_output=True
                )
            else:
                vite_process.terminate()
        except Exception:
            pass

atexit.register(cleanup)

def start_frontend():
    global vite_process
    print("[INFO] Starting Vite React frontend on http://localhost:5173...")
    
    # Hide extra window on Windows
    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = subprocess.CREATE_NO_WINDOW

    cmd = ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev"]
    
    try:
        vite_process = subprocess.Popen(
            cmd,
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=creation_flags
        )
    except Exception as e:
        print(f"[WARN] Could not auto-start Vite: {e}")

def open_browser():
    time.sleep(2.5)
    print("[INFO] Opening http://localhost:5173 in your default browser...")
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

if __name__ == "__main__":
    import threading
    import uvicorn

    print("=" * 60)
    print("       CmdGenie AI • Single-Console Unified Server       ")
    print("=" * 60)

    # 1. Start Vite in background without opening any extra windows
    start_frontend()

    # 2. Open browser automatically
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    print(f"[INFO] Starting FastAPI Backend on http://{HOST}:{PORT}...")
    print("Press Ctrl+C to stop both Backend and Frontend.\n")

    # 3. Run FastAPI in main thread
    try:
        uvicorn.run("app.main:app", host=HOST, port=PORT, log_level="info", reload=False)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping CmdGenie AI...")
    finally:
        cleanup()
