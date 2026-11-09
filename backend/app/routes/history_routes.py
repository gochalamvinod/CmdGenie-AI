from fastapi import APIRouter, HTTPException, Query
from ..services.history_service import (
    get_history_records,
    delete_history_record,
    clear_all_history,
    get_all_sessions,
    get_session_messages,
    delete_chat_session,
    clear_all_chat_sessions
)

router = APIRouter(prefix="/api/history", tags=["History"])

# Chat Sessions endpoints
@router.get("/sessions")
def list_sessions(limit: int = Query(50, ge=1, le=100)):
    """Fetch previous chat conversation sessions."""
    return get_all_sessions(limit=limit)

@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    """Fetch all messages within a specific chat session."""
    messages = get_session_messages(session_id)
    return {"session_id": session_id, "messages": messages}

@router.delete("/sessions/{session_id}")
def delete_session(session_id: str):
    """Delete an entire chat session and its messages."""
    success = delete_chat_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "deleted_session_id": session_id}

@router.delete("/sessions")
def clear_sessions():
    """Clear all chat sessions."""
    clear_all_chat_sessions()
    return {"success": True, "message": "All chat sessions cleared"}

# Legacy query log endpoints
@router.get("")
def list_history(limit: int = Query(50, ge=1, le=200)):
    """Fetch legacy query history records."""
    return get_history_records(limit=limit)

@router.delete("/{record_id}")
def delete_record(record_id: int):
    """Delete a single query record from history."""
    success = delete_history_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"success": True, "deleted_id": record_id}

@router.delete("")
def clear_history():
    """Clear all query records."""
    clear_all_history()
    return {"success": True, "message": "History cleared"}
