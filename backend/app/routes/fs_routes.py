import os
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..services.fs_service import (
    browse_directory, 
    get_folder_stats, 
    get_system_drives, 
    get_common_locations,
    open_native_folder_picker
)

router = APIRouter(prefix="/api/fs", tags=["FileSystem"])

class PathValidationRequest(BaseModel):
    path: str

class StatsRequest(BaseModel):
    path: str

class PickFolderRequest(BaseModel):
    initial_path: Optional[str] = None

@router.post("/pick-native")
def pick_native_folder(req: PickFolderRequest):
    """Open the native Windows OS folder selection dialog."""
    selected = open_native_folder_picker(req.initial_path)
    return {
        "selected": selected is not None,
        "path": selected
    }

@router.get("/browse")
def browse(path: Optional[str] = Query(None)):
    """Browse subdirectories for a given path."""
    return browse_directory(path)

@router.get("/quick-access")
def quick_access():
    """Return common shortcuts (Desktop, Documents, etc.) and drives."""
    return {
        "drives": get_system_drives(),
        "common": get_common_locations()
    }

@router.post("/validate")
def validate_path(req: PathValidationRequest):
    """Check if the path exists and is a valid directory."""
    clean_path = os.path.abspath(req.path.strip())
    exists = os.path.isdir(clean_path)
    return {
        "valid": exists,
        "path": clean_path,
        "name": os.path.basename(clean_path) if exists else ""
    }

@router.post("/stats")
def folder_stats(req: StatsRequest):
    """Get fast summary stats for the folder."""
    stats = get_folder_stats(req.path)
    if "error" in stats:
        raise HTTPException(status_code=400, detail=stats["error"])
    return stats
