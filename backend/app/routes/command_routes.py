from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services.executor_service import execute_command, is_admin

router = APIRouter(prefix="/api/command", tags=["Command Execution"])

class ExecuteRequest(BaseModel):
    command: str
    folder_path: str
    shell_type: Optional[str] = "powershell"
    timeout: Optional[int] = 40
    elevated: Optional[bool] = False

@router.get("/status")
def system_status():
    """Returns system execution capability and admin status."""
    return {
        "is_admin": is_admin(),
        "default_shell": "powershell",
        "supported_shells": ["powershell", "cmd", "bash"]
    }

@router.post("/execute")
def run_command(req: ExecuteRequest):
    """Execute arbitrary command with backend privileges in folder_path."""
    if not req.command or not req.command.strip():
        raise HTTPException(status_code=400, detail="Command string is required")
    
    result = execute_command(
        command=req.command.strip(),
        folder_path=req.folder_path,
        shell_type=req.shell_type or "powershell",
        timeout=req.timeout or 40,
        elevated=req.elevated or False
    )
    return result
