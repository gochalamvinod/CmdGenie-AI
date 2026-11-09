import os
import sys
import string
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

def get_system_drives() -> List[str]:
    """Get available drive letters on Windows or root on Unix."""
    drives = []
    if sys.platform == "win32":
        for letter in string.ascii_uppercase:
            drive_path = f"{letter}:\\"
            if os.path.exists(drive_path):
                drives.append(drive_path)
    else:
        drives.append("/")
    return drives

def get_common_locations() -> List[Dict[str, str]]:
    """Return common quick-access directories."""
    home = Path.home()
    locations = [
        {"name": "Desktop", "path": str(home / "Desktop")},
        {"name": "Documents", "path": str(home / "Documents")},
        {"name": "Downloads", "path": str(home / "Downloads")},
        {"name": "User Profile", "path": str(home)},
    ]
    # Filter to existing locations
    return [loc for loc in locations if os.path.isdir(loc["path"])]

def open_native_folder_picker(initial_path: Optional[str] = None) -> Optional[str]:
    """
    Open the native Windows folder picker dialog.
    Returns the chosen folder path or None if cancelled.
    """
    if sys.platform == "win32":
        try:
            # Try PowerShell Windows.Forms FolderBrowserDialog
            init_dir = initial_path if initial_path and os.path.isdir(initial_path) else str(Path.home() / "Desktop")
            ps_code = f"""
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = "Select target folder for CmdGenie AI"
$dialog.SelectedPath = "{init_dir}"
$dialog.ShowNewFolderButton = $true
$topForm = New-Object System.Windows.Forms.Form
$topForm.TopMost = $true
if ($dialog.ShowDialog($topForm) -eq [System.Windows.Forms.DialogResult]::OK) {{
    Write-Output $dialog.SelectedPath
}}
"""
            res = subprocess.run(
                ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", ps_code],
                capture_output=True,
                text=True,
                timeout=120
            )
            selected = res.stdout.strip()
            if selected and os.path.isdir(selected):
                return selected
        except Exception:
            pass

        # Fallback to tkinter
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            selected = filedialog.askdirectory(
                initialdir=initial_path or str(Path.home() / "Desktop"),
                title="Select Folder for CmdGenie AI"
            )
            root.destroy()
            if selected and os.path.isdir(selected):
                return selected
        except Exception:
            pass

    return None

def browse_directory(path: Optional[str] = None) -> Dict[str, Any]:
    """
    List folders in a directory for easy navigation in the UI.
    Only returns directories to keep response fast.
    """
    target = Path(path) if path else Path.home() / "Desktop"
    if not target.exists() or not target.is_dir():
        target = Path.home()

    folders = []
    try:
        with os.scandir(target) as entries:
            for entry in entries:
                try:
                    if entry.is_dir(follow_symlinks=False):
                        # Filter out system hidden folders if needed
                        if not entry.name.startswith("$") and not entry.name.startswith("."):
                            folders.append({
                                "name": entry.name,
                                "path": entry.path
                            })
                except (PermissionError, OSError):
                    continue
    except (PermissionError, OSError) as e:
        return {
            "current_path": str(target),
            "parent_path": str(target.parent) if target.parent != target else None,
            "folders": [],
            "error": str(e)
        }

    folders.sort(key=lambda x: x["name"].lower())

    return {
        "current_path": str(target),
        "parent_path": str(target.parent) if target.parent != target else None,
        "folders": folders,
        "drives": get_system_drives(),
        "common": get_common_locations()
    }

def get_folder_stats(folder_path: str) -> Dict[str, Any]:
    """Calculate quick stats for the selected folder."""
    target = Path(folder_path)
    if not target.exists() or not target.is_dir():
        return {"error": "Directory does not exist"}

    total_files = 0
    total_dirs = 0
    extensions: Dict[str, int] = {}
    sample_files: List[str] = []

    try:
        # Shallow scan for instant speed
        with os.scandir(target) as entries:
            for entry in entries:
                try:
                    if entry.is_dir(follow_symlinks=False):
                        total_dirs += 1
                    elif entry.is_file(follow_symlinks=False):
                        total_files += 1
                        ext = Path(entry.name).suffix.lower() or "(no ext)"
                        extensions[ext] = extensions.get(ext, 0) + 1
                        if len(sample_files) < 15:
                            sample_files.append(entry.name)
                except (PermissionError, OSError):
                    continue
    except Exception as e:
        return {"error": str(e)}

    return {
        "folder_path": str(target),
        "folder_name": target.name or str(target),
        "immediate_files": total_files,
        "immediate_dirs": total_dirs,
        "top_extensions": sorted(extensions.items(), key=lambda x: x[1], reverse=True)[:6],
        "sample_files": sample_files
    }
