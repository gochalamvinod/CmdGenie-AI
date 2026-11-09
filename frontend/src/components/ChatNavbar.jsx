import React from 'react';
import { Terminal, ShieldCheck, ShieldAlert, History, Settings, Plus, Sparkles } from 'lucide-react';

export default function ChatNavbar({
  isAdmin,
  backendOnline,
  onOpenSettings,
  onOpenHistory,
  onNewChat
}) {
  return (
    <header className="chat-navbar">
      <div className="nav-brand">
        <div className="nav-logo-icon">
          <Terminal size={20} color="#ffffff" />
        </div>
        <div>
          <div className="nav-title">
            <span>CmdGenie AI</span>
            <span className="nav-tag">Admin Agent</span>
          </div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Admin Badge */}
        <div 
          className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}
          title={isAdmin ? "Full Windows Administrator Privileges Active" : "Standard User Mode"}
        >
          {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          <span>{isAdmin ? 'Admin Active' : 'Standard User'}</span>
        </div>

        {/* Backend Connectivity Status */}
        <div
          className="badge"
          style={{
            background: backendOnline ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: backendOnline ? '#34d399' : '#f87171',
            border: `1px solid ${backendOnline ? 'var(--success-border)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
          <span>{backendOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onNewChat}
          title="Start a fresh conversation"
        >
          <Plus size={15} />
          <span>New Chat</span>
        </button>

        {/* History */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenHistory}
          title="Previous Query History"
        >
          <History size={15} />
          <span>History</span>
        </button>

        {/* Settings */}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onOpenSettings}
          title="Settings & API Key"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
