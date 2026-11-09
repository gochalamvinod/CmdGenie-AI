import json
import re
import sys
from typing import Dict, Any, Optional, List

# Primary model: gemini-3.5-flash-lite for blazing speed and lightweight execution
PRIMARY_MODEL = "gemini-3.5-flash-lite"
FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.8-flash"]

def _clean_json_response(raw_text: str) -> Dict[str, Any]:
    """Clean markdown code fences and extract JSON object."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Could not parse JSON from AI response: {raw_text[:200]}")

def get_client(api_key: str):
    """Initialize google-genai client."""
    from google import genai
    return genai.Client(api_key=api_key)

def test_api_key(api_key: str) -> Dict[str, Any]:
    """Verify if the provided Gemini API key is valid."""
    if not api_key or not api_key.strip():
        return {"valid": False, "error": "API key cannot be empty"}
    
    client = get_client(api_key.strip())
    errors = []
    for model in [PRIMARY_MODEL] + FALLBACK_MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents='Respond in one word: PONG',
            )
            text = response.text.strip() if hasattr(response, 'text') else str(response)
            return {"valid": True, "model": model, "response": text}
        except Exception as e:
            errors.append(f"{model}: {str(e)}")
            continue

    return {"valid": False, "error": " | ".join(errors)}

def _format_conversation_history(history: Optional[List[Dict[str, Any]]]) -> str:
    """Format past conversation turns into a compact context string."""
    if not history:
        return "None (This is the start of the conversation)"
    
    lines = []
    for idx, turn in enumerate(history[-5:], 1):  # Keep last 5 turns
        role = turn.get("role") or turn.get("sender") or "user"
        content = turn.get("content") or turn.get("text") or ""
        cmd = turn.get("command")
        if role in ("user", "human"):
            lines.append(f"Turn {idx} [User]: {content}")
        else:
            lines.append(f"Turn {idx} [Assistant Answer]: {content[:200]}")
            if cmd:
                lines.append(f"         [Command Executed]: {cmd}")
    return "\n".join(lines)

def generate_shell_command(
    query: str,
    folder_path: str,
    api_key: str,
    shell_type: str = "powershell",
    model_name: str = PRIMARY_MODEL,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Stage 1: Generate a high-speed, safe, context-aware PowerShell command.
    """
    os_name = "Windows" if sys.platform == "win32" else "Linux/macOS"
    history_context = _format_conversation_history(conversation_history)
    
    prompt = f"""You are an expert Windows system administrator and PowerShell automation AI.
The user is managing this directory: "{folder_path}"
Operating System: {os_name}
Shell: {shell_type.upper()}
Backend has FULL ADMINISTRATOR ACCESS.

PRIOR CONVERSATION CONTEXT:
\"\"\"
{history_context}
\"\"\"

CURRENT USER REQUEST:
"{query}"

INSTRUCTIONS:
1. Understand the user's intent in light of prior conversation.
   - If the user says "I SAID LIST" or "list them" or "show more", look at what was previously discussed and produce the command that LISTS the exact items (with Name, Size, Path) in detail!
   - If the user asks a follow-up ("delete the first one", "show only pdfs"), resolve pronouns/references using the prior conversation context.

2. COMMAND QUALITY & OUTPUT:
   - When asked to "list" or "find" items (e.g. "list top 10 biggest txt files"):
     Ensure the command outputs all 10 items in a table/list with Name, Size, and Path:
     `Get-ChildItem -Path . -Recurse -File -Filter *.txt -ErrorAction SilentlyContinue | Where-Object {{ $_.FullName -notmatch '(node_modules|\.git|venv)' }} | Sort-Object Length -Descending | Select-Object -First 10 Name, @{{N='SizeMB';E={{[math]::Round($_.Length/1MB,2)}}}}, FullName | Format-Table -AutoSize`
   - When asked for a simple count: `$c = (Get-ChildItem -File).Count; "Count: $c"`
   - Always skip heavy folders (`node_modules`, `venv`, `.git`) during `-Recurse`.
   - Never pipe unbounded thousands of files to Format-Table. Always cap listings with `Select-Object -First 30`.

3. CRITICAL POWERSHELL SYNTAX & LOOP RULES:
   - When creating multiple files in a loop:
     NEVER write `"$_.txt"` inside double quotes!
     ALWAYS write: `1..20 | ForEach-Object {{ $n = "file_$_.txt"; Set-Content -Path (Join-Path "FolderName" $n) -Value "Content $_" }}`
   - The command must run unattended with no interactive prompts.

Respond ONLY with a JSON object in this exact schema:
{{
  "command": "powershell command here",
  "explanation": "Brief 1-sentence explanation of what the command does",
  "operation": "CREATE" | "READ" | "UPDATE" | "DELETE",
  "is_destructive": false,
  "confidence": "high"
}}
"""

    client = get_client(api_key.strip())
    models_to_try = [model_name] + [m for m in FALLBACK_MODELS if m != model_name]
    last_err = None

    for m in models_to_try:
        try:
            res = client.models.generate_content(
                model=m,
                contents=prompt,
            )
            return _clean_json_response(res.text)
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(f"Gemini command generation failed: {str(last_err)}")

def synthesize_human_answer(
    query: str,
    command: str,
    stdout: str,
    stderr: str,
    exit_code: int,
    folder_path: str,
    api_key: str,
    model_name: str = PRIMARY_MODEL,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> str:
    """
    Stage 2: Formulate accurate, context-aware human response.
    """
    history_context = _format_conversation_history(conversation_history)

    prompt = f"""You are a helpful and accurate assistant.
Target Folder: "{folder_path}"

PRIOR CONVERSATION CONTEXT:
\"\"\"
{history_context}
\"\"\"

CURRENT USER QUERY:
"{query}"

EXECUTED COMMAND:
`{command}`

EXIT CODE: {exit_code}
STDOUT OUTPUT:
\"\"\"
{stdout.strip() if stdout.strip() else "[None]"}
\"\"\"
STDERR OUTPUT:
\"\"\"
{stderr.strip() if stderr.strip() else "[None]"}
\"\"\"

CRITICAL ANSWER FORMATTING RULES:
1. IF THE USER ASKED TO "LIST", "SHOW", OR "DISPLAY" ITEMS (e.g. "LIST TOP 10 BIGGEST TXT FILES", "I SAID LIST"):
   - YOU MUST OUTPUT THE ACTUAL NUMBERED LIST (1., 2., 3., etc.) of all matching items found in the terminal output!
   - Format each item clearly with:
     1. **filename.ext** (Size) - `Path or subfolder`
     2. ...
   - DO NOT summarize into a generic paragraph when a list is requested! The user wants to see the actual list!

2. IF THE USER ASKED A DIRECT COUNT OR YES/NO QUESTION:
   - Answer directly in 1 sentence with key numbers in **bold** (e.g. "There are **28** files named 'vinod'.").

3. IF A CRUD ACTION OCCURRED (CREATE, DELETE, RENAME, MOVE):
   - Confirm the action in 1 clear sentence (e.g. "Folder **project_backup** created successfully.").

4. BE HUMANIC, PRECISE, AND ACCURATE:
   - Use the terminal output truth; do not invent files that are not in STDOUT.
   - If an error occurred, explain it clearly in plain English.
"""

    client = get_client(api_key.strip())
    models_to_try = [model_name] + [m for m in FALLBACK_MODELS if m != model_name]

    for m in models_to_try:
        try:
            res = client.models.generate_content(
                model=m,
                contents=prompt,
            )
            return res.text.strip()
        except Exception:
            continue

    if exit_code == 0:
        return f"Output:\n{stdout[:400]}"
    return f"Error: {stderr[:300]}"
