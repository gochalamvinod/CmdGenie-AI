import os
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..config import GEMINI_API_KEY
from ..services.gemini_service import test_api_key, generate_shell_command, synthesize_human_answer
from ..services.executor_service import execute_command
from ..services.history_service import (
    save_history_record, 
    create_or_update_session, 
    save_chat_message,
    get_session_messages
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

class KeyTestRequest(BaseModel):
    api_key: str

class GenerateCommandRequest(BaseModel):
    query: str
    folder_path: str
    api_key: Optional[str] = None
    shell_type: Optional[str] = "powershell"
    conversation_history: Optional[List[Dict[str, Any]]] = []

class SynthesizeRequest(BaseModel):
    query: str
    command: str
    stdout: str
    stderr: str
    exit_code: int
    folder_path: str
    api_key: Optional[str] = None
    conversation_history: Optional[List[Dict[str, Any]]] = []

class AskPipelineRequest(BaseModel):
    query: str
    folder_path: str
    api_key: Optional[str] = None
    shell_type: Optional[str] = "powershell"
    auto_execute: Optional[bool] = True
    session_id: Optional[str] = None
    conversation_history: Optional[List[Dict[str, Any]]] = []

def _resolve_api_key(provided_key: Optional[str]) -> str:
    key = (provided_key or "").strip() or GEMINI_API_KEY.strip()
    if not key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API Key is missing. Please provide it in the header/settings or set GEMINI_API_KEY in backend/.env"
        )
    return key

@router.post("/test-key")
def check_key(req: KeyTestRequest):
    """Test if a Gemini API key is active and functional."""
    result = test_api_key(req.api_key)
    return result

@router.post("/generate-command")
def generate_command(req: GenerateCommandRequest):
    """Stage 1: Generate shell command from natural language query with context."""
    api_key = _resolve_api_key(req.api_key)
    try:
        data = generate_shell_command(
            query=req.query,
            folder_path=req.folder_path,
            api_key=api_key,
            shell_type=req.shell_type or "powershell",
            conversation_history=req.conversation_history
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize-answer")
def synthesize(req: SynthesizeRequest):
    """Stage 2: Formulate direct human answer from command execution output with context."""
    api_key = _resolve_api_key(req.api_key)
    try:
        answer = synthesize_human_answer(
            query=req.query,
            command=req.command,
            stdout=req.stdout,
            stderr=req.stderr,
            exit_code=req.exit_code,
            folder_path=req.folder_path,
            api_key=api_key,
            conversation_history=req.conversation_history
        )
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask")
def full_ask_pipeline(req: AskPipelineRequest):
    """
    End-to-End Execution Pipeline with Multi-Turn Context & Session Sync:
    1. Gemini analyzes query + previous conversation turns -> generates exact PowerShell command.
    2. Backend executes command with administrative privileges in folder_path.
    3. Gemini reviews stdout/stderr + prior turns -> crafts accurate, direct human response.
    4. Automatically persists messages to SQLite session & history audit log.
    """
    api_key = _resolve_api_key(req.api_key)
    session_id = req.session_id or str(uuid.uuid4())
    
    # Ensure session exists in database with human-readable title
    session_title = req.query[:45].strip()
    create_or_update_session(session_id, title=session_title, folder_path=req.folder_path)

    # Save incoming user message to session
    save_chat_message(
        session_id=session_id,
        role="user",
        content=req.query
    )

    # 1. Generate Command (with multi-turn context)
    try:
        cmd_info = generate_shell_command(
            query=req.query,
            folder_path=req.folder_path,
            api_key=api_key,
            shell_type=req.shell_type or "powershell",
            conversation_history=req.conversation_history
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate command: {str(e)}")

    command = cmd_info.get("command", "")
    explanation = cmd_info.get("explanation", "")
    operation = cmd_info.get("operation", "READ")
    is_destructive = cmd_info.get("is_destructive", False)

    # If auto-execute is disabled, return the generated command for user preview
    if not req.auto_execute:
        return {
            "session_id": session_id,
            "query": req.query,
            "folder_path": req.folder_path,
            "command": command,
            "explanation": explanation,
            "operation": operation,
            "is_destructive": is_destructive,
            "executed": False,
            "stdout": "",
            "stderr": "",
            "exit_code": None,
            "human_answer": None
        }

    # 2. Execute Command
    exec_result = execute_command(
        command=command,
        folder_path=req.folder_path,
        shell_type=req.shell_type or "powershell"
    )

    stdout = exec_result.get("stdout", "")
    stderr = exec_result.get("stderr", "")
    exit_code = exec_result.get("exit_code", 0)
    duration_ms = exec_result.get("duration_ms", 0)

    # 3. Synthesize Human Answer (with multi-turn context)
    try:
        human_answer = synthesize_human_answer(
            query=req.query,
            command=command,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            folder_path=req.folder_path,
            api_key=api_key,
            conversation_history=req.conversation_history
        )
    except Exception as e:
        human_answer = f"Command executed with code {exit_code}, but failed to synthesize natural language answer: {str(e)}"

    # 4. Save to Legacy History & Chat Session Messages
    record_id = save_history_record(
        folder_path=req.folder_path,
        user_query=req.query,
        generated_command=command,
        command_explanation=explanation,
        terminal_output=stdout + (f"\nSTDERR:\n{stderr}" if stderr else ""),
        exit_code=exit_code,
        duration_ms=duration_ms,
        human_answer=human_answer,
        status="completed" if exit_code == 0 else "warning"
    )

    save_chat_message(
        session_id=session_id,
        role="assistant",
        content=human_answer,
        command=command,
        explanation=explanation,
        operation=operation,
        stdout=stdout,
        stderr=stderr,
        exit_code=exit_code,
        duration_ms=duration_ms
    )

    return {
        "session_id": session_id,
        "record_id": record_id,
        "query": req.query,
        "folder_path": req.folder_path,
        "command": command,
        "explanation": explanation,
        "operation": operation,
        "is_destructive": is_destructive,
        "executed": True,
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "duration_ms": duration_ms,
        "human_answer": human_answer
    }
