import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, ArrowUp, HardDrive, Check, X, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function FolderBrowserModal({ isOpen, onClose, currentPath, onSelectFolder }) {
  const [browsePath, setBrowsePath] = useState(currentPath || '');
  const [browseData, setBrowseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDirectory(currentPath);
    }
  }, [isOpen, currentPath]);

  const loadDirectory = async (path) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.browseFolder(path);
      setBrowseData(data);
      setBrowsePath(data.current_path);
    } catch (err) {
      setError(err.message || 'Failed to list folders');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderPath) => {
    loadDirectory(folderPath);
  };

  const handleGoUp = () => {
    if (browseData?.parent_path) {
      loadDirectory(browseData.parent_path);
    }
  };

  const handleSelectCurrent = () => {
    onSelectFolder(browsePath);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <FolderOpen size={20} color="#6366f1" />
            <span>Select Folder on Computer</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Drives and Common quick links */}
          <div className="quick-chips" style={{ marginBottom: '6px' }}>
            <span className="quick-label">Drives:</span>
            {browseData?.drives?.map((drive) => (
              <button
                key={drive}
                type="button"
                className={`chip ${browsePath.toLowerCase().startsWith(drive.toLowerCase()) ? 'active' : ''}`}
                onClick={() => loadDirectory(drive)}
              >
                <HardDrive size={13} />
                <span>{drive}</span>
              </button>
            ))}
          </div>

          {/* Current Path Bar & Go Up */}
          <div className="browser-nav-bar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleGoUp}
              disabled={!browseData?.parent_path || loading}
              title="Go to parent directory"
            >
              <ArrowUp size={14} />
              <span>Up</span>
            </button>
            <div className="browser-path-display" title={browsePath}>
              {browsePath}
            </div>
          </div>

          {/* Error notice if any */}
          {error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem' }}>
              Notice: {error}
            </div>
          )}

          {/* Loading or Folders Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '8px', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="spinner" />
              <span>Reading folder structure...</span>
            </div>
          ) : (
            <div className="folder-grid">
              {browseData?.folders?.map((folder) => (
                <button
                  key={folder.path}
                  type="button"
                  className="folder-item"
                  onClick={() => handleFolderClick(folder.path)}
                  title={`Open ${folder.name}`}
                >
                  <Folder size={18} color="#818cf8" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {folder.name}
                  </span>
                </button>
              ))}

              {(!browseData?.folders || browseData.folders.length === 0) && !loading && (
                <div style={{ gridColumn: '1 / -1', padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No subdirectories found in this folder.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSelectCurrent}
          >
            <Check size={16} />
            <span>Select This Folder</span>
          </button>
        </div>
      </div>
    </div>
  );
}
