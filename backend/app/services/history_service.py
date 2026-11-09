import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..config import DB_PATH

def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    # Legacy flat query history
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS query_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            folder_path TEXT NOT NULL,
            user_query TEXT NOT NULL,
            generated_command TEXT NOT NULL,
            command_explanation TEXT,
            terminal_output TEXT,
            exit_code INTEGER,
            duration_ms INTEGER,
            human_answer TEXT,
            status TEXT DEFAULT 'completed'
        )
    """)
    # Chat sessions for multi-turn conversations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            folder_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Chat messages within sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            command TEXT,
            explanation TEXT,
            operation TEXT,
            stdout TEXT,
            stderr TEXT,
            exit_code INTEGER,
            duration_ms INTEGER,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

# ----------------- Chat Session Management -----------------

def create_or_update_session(session_id: str, title: str, folder_path: str):
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO chat_sessions (session_id, title, folder_path, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
            title = excluded.title,
            updated_at = excluded.updated_at
    """, (session_id, title, folder_path, now, now))
    conn.commit()
    conn.close()

def save_chat_message(
    session_id: str,
    role: str,
    content: str,
    command: Optional[str] = None,
    explanation: Optional[str] = None,
    operation: Optional[str] = None,
    stdout: Optional[str] = None,
    stderr: Optional[str] = None,
    exit_code: Optional[int] = None,
    duration_ms: Optional[int] = None,
    timestamp: Optional[str] = None
) -> int:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    now = timestamp or datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO chat_messages (
            session_id, role, content, command, explanation, operation,
            stdout, stderr, exit_code, duration_ms, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, role, content, command, explanation, operation,
        stdout, stderr, exit_code, duration_ms, now
    ))
    msg_id = cursor.lastrowid
    # Update session updated_at
    cursor.execute("UPDATE chat_sessions SET updated_at = ? WHERE session_id = ?", (now, session_id))
    conn.commit()
    conn.close()
    return msg_id

def get_all_sessions(limit: int = 50) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.*, 
               (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.session_id) AS message_count,
               (SELECT content FROM chat_messages m WHERE m.session_id = s.session_id ORDER BY m.id DESC LIMIT 1) AS last_message
        FROM chat_sessions s
        ORDER BY s.updated_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM chat_messages
        WHERE session_id = ?
        ORDER BY id ASC
    """, (session_id,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def delete_chat_session(session_id: str) -> bool:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_messages WHERE session_id = ?", (session_id,))
    cursor.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def clear_all_chat_sessions() -> bool:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_messages")
    cursor.execute("DELETE FROM chat_sessions")
    conn.commit()
    conn.close()
    return True

# ----------------- Legacy Query Log Methods -----------------

def save_history_record(
    folder_path: str,
    user_query: str,
    generated_command: str,
    command_explanation: str = "",
    terminal_output: str = "",
    exit_code: int = 0,
    duration_ms: int = 0,
    human_answer: str = "",
    status: str = "completed"
) -> int:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO query_history (
            timestamp, folder_path, user_query, generated_command, 
            command_explanation, terminal_output, exit_code, duration_ms, 
            human_answer, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        now, folder_path, user_query, generated_command, 
        command_explanation, terminal_output, exit_code, duration_ms, 
        human_answer, status
    ))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id

def get_history_records(limit: int = 50) -> List[Dict[str, Any]]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM query_history 
        ORDER BY id DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    results = [dict(row) for row in rows]
    conn.close()
    return results

def delete_history_record(record_id: int) -> bool:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM query_history WHERE id = ?", (record_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def clear_all_history() -> bool:
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    cursor.execute("DELETE FROM query_history")
    conn.commit()
    conn.close()
    return True
