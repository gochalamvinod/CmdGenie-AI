import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Standalone Root .env Configuration
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent
ROOT_ENV = ROOT_DIR / ".env"

if ROOT_ENV.exists():
    load_dotenv(ROOT_ENV, override=True)
else:
    load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_FOLDER = os.getenv("DEFAULT_FOLDER") or str(Path.home() / "Desktop")
PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "127.0.0.1")
DEFAULT_SHELL = os.getenv("DEFAULT_SHELL", "powershell" if sys.platform == "win32" else "bash")

# Data directory for SQLite history
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "history.db"
