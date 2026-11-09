import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import PORT, HOST, GEMINI_API_KEY
from .services.history_service import init_db
from .services.executor_service import is_admin
from .routes.fs_routes import router as fs_router
from .routes.command_routes import router as command_router
from .routes.ai_routes import router as ai_router
from .routes.history_routes import router as history_router

app = FastAPI(
    title="CmdGenie AI Backend",
    description="Natural Language File Intelligence and Command Execution Agent",
    version="1.0.0"
)

# Enable CORS for all local origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Mount API routers
app.include_router(fs_router)
app.include_router(command_router)
app.include_router(ai_router)
app.include_router(history_router)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "platform": sys.platform,
        "is_admin": is_admin(),
        "has_api_key": bool(GEMINI_API_KEY and GEMINI_API_KEY.strip()),
        "python_version": sys.version
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
