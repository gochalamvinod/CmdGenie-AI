import React, { useState } from 'react';
import { Folder, FolderOpen, Compass, RefreshCw, Files } from 'lucide-react';
import { api } from '../services/api';

export default function FolderBar({
  currentPath,
  onPathChange,
  onOpenBrowser,
  folderStats,
  onRefreshStats,
}) {
  const [isPickingNative, setIsPickingNative] = useState(false);

  const handleNativePick = async () => {
    setIsPickingNative(true);
    try {
      const res = await api.pickNativeFolder(currentPath);
      if (res && res.selected && res.path) {
        onPathChange(res.path);
      }
    } catch (err) {
      console.warn('Native picker error, opening in-app browser:', err);
      onOpenBrowser();
    } finally {
      setIsPickingNative(false);
    }
  };

  return (
    <div className="folder-scope-bar">
      <div className="folder-scope-left">
        <div className="folder-icon-badge" title="Active Working Directory">
          <Folder size={17} />
        </div>

        <div className="folder-path-display" title={currentPath}>
          {currentPath}
        </div>

        {folderStats && !folderStats.error && (
          <div className="folder-stats-pill">
            <Files size={12} />
            <span>
              {folderStats.immediate_files ?? 0} files • {folderStats.immediate_dirs ?? 0} folders
            </span>
          </div>
        )}
      </div>

      <div className="folder-scope-actions">
        {/* Native Windows Folder Picker */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          onClick={handleNativePick}
          disabled={isPickingNative}
          title="Open native Windows Folder Dialog"
        >
          <FolderOpen size={14} />
          <span>{isPickingNative ? 'Selecting...' : 'Select Folder'}</span>
        </button>

        {/* In-app Explorer */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          onClick={onOpenBrowser}
          title="Open folder explorer"
        >
          <Compass size={14} />
          <span>Explorer</span>
        </button>

        {/* Refresh Stats */}
        <button
          type="button"
          className="btn-icon"
          style={{ padding: '6px' }}
          onClick={onRefreshStats}
          title="Refresh folder stats"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    </div>
  );
}
