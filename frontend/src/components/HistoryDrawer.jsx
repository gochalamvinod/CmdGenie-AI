import React, { useState, useEffect } from 'react';
import { MessageSquare, Trash2, X, Clock, Folder, Check } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryDrawer({ isOpen, onClose, onSelectSession, activeSessionId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await api.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all past chat conversations?')) {
      try {
        await api.clearSessions();
        setSessions([]);
      } catch (err) {
        console.error('Failed to clear sessions:', err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <MessageSquare size={18} color="#6366f1" />
            <span>Chat Conversations History</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sessions.length > 0 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearAll}
                style={{ color: '#f87171' }}
                title="Delete all saved conversations"
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}

            <button className="btn-icon" onClick={onClose}>
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
              Loading saved conversations...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
              No conversations recorded yet. Start chatting to save conversations automatically!
            </div>
          ) : (
            <div className="history-list">
              {sessions.map((sess) => {
                const isActive = activeSessionId === sess.session_id;
                return (
                  <div
                    key={sess.session_id}
                    className="history-item"
                    onClick={() => {
                      onSelectSession(sess);
                      onClose();
                    }}
                    style={{
                      cursor: 'pointer',
                      borderLeft: isActive ? '3px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: isActive ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                    }}
                  >
                    <div className="history-meta">
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(sess.updated_at || sess.created_at).toLocaleString()}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {sess.message_count || 0} messages
                        </span>

                        <button
                          type="button"
                          className="btn-icon"
                          style={{ padding: '3px' }}
                          onClick={(e) => handleDeleteSession(sess.session_id, e)}
                          title="Delete this conversation"
                        >
                          <Trash2 size={13} color="#f87171" />
                        </button>
                      </div>
                    </div>

                    <div className="history-query" style={{ fontSize: '0.925rem', color: '#ffffff' }}>
                      {sess.title}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Folder size={12} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sess.folder_path}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
