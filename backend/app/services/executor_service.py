import os
import sys
import time
import base64
import subprocess
import ctypes
from pathlib import Path
from typing import Dict, Any, Optional

def is_admin() -> bool:
    """Check if the current process has administrator privileges on Windows."""
    if sys.platform == "win32":
        try:
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except Exception:
            return False
    else:
        return os.geteuid() == 0

def run_elevated_script(command: str, working_dir: str) -> Dict[str, Any]:
    """
    On Windows, if needed, run an out-of-process elevated command via ShellExecute 'runas'.
    Writes output to a temporary file and reads it back.
    """
    import tempfile
    start_time = time.time()
    
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as out_f, \
         tempfile.NamedTemporaryFile(suffix=".ps1", delete=False, mode="w", encoding="utf-8") as script_f:
        
        out_path = out_f.name
        script_path = script_f.name

        # Script captures all output to out_path
        script_content = f"""
$ErrorActionPreference = 'Continue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -LiteralPath "{working_dir}"
try {{
    {command} *>&1 | Out-File -FilePath "{out_path}" -Encoding utf8
}} catch {{
    $_ | Out-File -FilePath "{out_path}" -Append -Encoding utf8
}}
"""
        script_f.write(script_content)

    try:
        # Run elevated PowerShell with UAC
        cmd = [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-Command",
            f"Start-Process powershell -Verb RunAs -Wait -WindowStyle Hidden -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"{script_path}\"'"
        ]
        
        proc = subprocess.run(cmd, timeout=60, capture_output=True)
        
        # Read output from file
        stdout = ""
        if os.path.exists(out_path):
            with open(out_path, "r", encoding="utf-8", errors="replace") as f:
                stdout = f.read()
            try:
                os.remove(out_path)
            except Exception:
                pass
                
        try:
            os.remove(script_path)
        except Exception:
            pass

        duration_ms = int((time.time() - start_time) * 1000)
        return {
            "command": command,
            "folder_path": working_dir,
            "shell_type": "powershell (elevated UAC)",
            "stdout": stdout,
            "stderr": "",
            "exit_code": 0,
            "duration_ms": duration_ms,
            "is_admin": True
        }
    except Exception as e:
        return {
            "command": command,
            "folder_path": working_dir,
            "shell_type": "powershell (elevated)",
            "stdout": "",
            "stderr": f"Elevation error: {str(e)}",
            "exit_code": 1,
            "duration_ms": int((time.time() - start_time) * 1000),
            "is_admin": is_admin()
        }

def execute_command(
    command: str,
    folder_path: str,
    shell_type: str = "powershell",
    timeout: int = 25,
    force_elevated: bool = False
) -> Dict[str, Any]:
    """
    Execute a shell command with the target directory as cwd.
    If the backend is already running as Administrator, every standard command inherits admin rights!
    If force_elevated is True and backend is not admin, it triggers UAC elevation.
    """
    start_time = time.time()
    target_dir = folder_path if os.path.isdir(folder_path) else os.getcwd()
    admin_status = is_admin()

    # If user requests force-elevated and process isn't already admin on Windows:
    if force_elevated and sys.platform == "win32" and not admin_status:
        return run_elevated_script(command, target_dir)

    # Standard execution (inherits admin tokens if process is elevated)
    is_win = sys.platform == "win32"
    if is_win:
        if shell_type.lower() == "cmd":
            cmd_args = ["cmd.exe", "/c", command]
        else:
            # PowerShell with Base64 UTF-16LE EncodedCommand for 100% reliable script execution
            ps_script = (
                "$ProgressPreference = 'SilentlyContinue'\n"
                "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8\n"
                f"{command}"
            )
            encoded_b64 = base64.b64encode(ps_script.encode("utf-16le")).decode("ascii")
            cmd_args = [
                "powershell.exe",
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-NonInteractive",
                "-EncodedCommand", encoded_b64
            ]
    else:
        cmd_args = ["/bin/bash", "-c", command]

    try:
        result = subprocess.run(
            cmd_args,
            cwd=target_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            text=False
        )
        stdout = _decode_output(result.stdout)
        stderr = _decode_output(result.stderr)
        
        # Strip PowerShell CLIXML progress stream noise
        if "#< CLIXML" in stderr:
            stderr = "\n".join([line for line in stderr.splitlines() if not line.startswith("<") and not line.startswith("#<")]).strip()

        exit_code = result.returncode

    except subprocess.TimeoutExpired as e:
        stdout = _decode_output(e.stdout) if e.stdout else ""
        stderr = f"[Execution Timed Out after {timeout} seconds]"
        exit_code = 124
    except Exception as e:
        stdout = ""
        stderr = f"[Execution Error: {str(e)}]"
        exit_code = 1

    duration_ms = int((time.time() - start_time) * 1000)
    
    max_len = 200000
    if len(stdout) > max_len:
        stdout = stdout[:max_len] + f"\n\n... [Output truncated: exceeded {max_len} characters] ..."
    if len(stderr) > max_len:
        stderr = stderr[:max_len] + f"\n\n... [Stderr truncated: exceeded {max_len} characters] ..."

    return {
        "command": command,
        "folder_path": target_dir,
        "shell_type": shell_type,
        "stdout": stdout,
        "stderr": stderr,
        "exit_code": exit_code,
        "duration_ms": duration_ms,
        "is_admin": admin_status
    }

def _decode_output(raw_bytes: Optional[bytes]) -> str:
    if not raw_bytes:
        return ""
    for enc in ("utf-8", "cp1252", "cp437", "latin-1"):
        try:
            return raw_bytes.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw_bytes.decode("utf-8", errors="replace")
