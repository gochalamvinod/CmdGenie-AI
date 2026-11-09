import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, HardDrive, Files, RefreshCw, CheckCircle2, AlertCircle, Monitor, Compass } from 'lucide-react';
import { api } from '../services/api';

export default function FolderSelector({
  currentPath,
  onPathChange,
  onOpenBrowser,
  folderStats,
  onRefreshStats,
  isLoadingStats,
  quickLocations,
}) {
  const [inputVal, setInputVal] = useState(currentPath);
  const [isPickingNative, setIsPickingNative] = useState(false);

  useEffect(() => {
    setInputVal(currentPath);
  }, [currentPath]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal && inputVal.trim()) {
      onPathChange(inputVal.trim());
    }
  };

  const handleNativePick = async () => {
    setIsPickingNative(true);
    try {
      const res = await api.pickNativeFolder(currentPath);
      if (res && res.selected && res.path) {
        onPathChange(res.path);
      }
    } catch (err) {
      console.warn('Native picker notice:', err);
      // Fallback to in-app browser modal if native picker fails
      onOpenBrowser();
    } finally {
      setIsPickingNative(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <Folder size={18} color="#818cf8" />
        <span>Selected Folder & Working Directory</span>
      </div>

      <div className="folder-picker-bar">
        {/* Input Bar with buttons */}
        <form onSubmit={handleSubmit} className="path-input-group">
          <div className="path-input-wrapper">
            <FolderOpen size={18} className="path-icon" />
            <input
              type="text"
              className="path-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. C:\Users\YourName\Desktop or D:\MyData"
            />
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            title="Set typed path"
          >
            Set Path
          </button>

          {/* Native Windows Folder Picker */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNativePick}
            disabled={isPickingNative}
            title="Open native Windows folder selection window"
          >
            <FolderOpen size={16} />
            <span>{isPickingNative ? 'Selecting...' : 'Select Folder'}</span>
          </button>

          {/* Web Tree Browser */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenBrowser}
            title="Open in-app folder explorer"
          >
            <Compass size={16} />
            <span>Explorer</span>
          </button>
        </form>

        {/* Quick Drive & Folder Chips */}
        <div className="quick-chips">
          <span className="quick-label">Quick Pick:</span>

          {quickLocations?.common?.map((loc) => (
            <button
              key={loc.path}
              type="button"
              className={`chip ${currentPath.toLowerCase() === loc.path.toLowerCase() ? 'active' : ''}`}
              onClick={() => onPathChange(loc.path)}
            >
              <Folder size={13} />
              <span>{loc.name}</span>
            </button>
          ))}

          {quickLocations?.drives?.map((drive) => (
            <button
              key={drive}
              type="button"
              className={`chip ${currentPath.toLowerCase().startsWith(drive.toLowerCase()) ? 'active' : ''}`}
              onClick={() => onPathChange(drive)}
            >
              <HardDrive size={13} />
              <span>{drive}</span>
            </button>
          ))}
        </div>

        {/* Folder Snapshot Bar */}
        {folderStats && !folderStats.error && (
          <div className="folder-stats-bar">
            <div className="stat-item">
              <Files size={18} className="stat-icon" />
              <div>
                <div className="stat-label">Immediate Files</div>
                <div className="stat-value">{folderStats.immediate_files ?? 0} files</div>
              </div>
            </div>

            <div className="stat-item">
              <Folder size={18} className="stat-icon" />
              <div>
                <div className="stat-label">Immediate Subfolders</div>
                <div className="stat-value">{folderStats.immediate_dirs ?? 0} folders</div>
              </div>
            </div>

            <div className="stat-item" style={{ gridColumn: 'span 2' }}>
              <div style={{ flex: 1 }}>
                <div className="stat-label">File Types in Selected Folder</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {folderStats.top_extensions && folderStats.top_extensions.length > 0 ? (
                    folderStats.top_extensions.map(([ext, count]) => (
                      <span key={ext} className="chip" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                        <code>{ext}</code> ({count})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>No files in folder root</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="btn-icon"
                onClick={onRefreshStats}
                title="Refresh Folder Stats"
                disabled={isLoadingStats}
              >
                <RefreshCw size={14} className={isLoadingStats ? 'spinner' : ''} />
              </button>
            </div>
          </div>
        )}

        {folderStats?.error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>Folder Notice: {folderStats.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
