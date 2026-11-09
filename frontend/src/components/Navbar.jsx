import React from 'react';
import { ShieldCheck, ShieldAlert, Settings, History, Terminal, Sparkles } from 'lucide-react';

export default function Navbar({ isAdmin, onOpenSettings, onOpenHistory, backendOnline }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="brand">
          <div className="brand-icon-wrapper">
            <Terminal size={22} color="#ffffff" />
          </div>
          <div>
            <div className="brand-title">CmdGenie AI</div>
            <div className="brand-subtitle">Admin Shell & Folder Intelligence</div>
          </div>
        </div>

        <div className="header-actions">
          {/* Admin Status Pill */}
          <div 
            className={`badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}
            title={isAdmin ? "Backend has Full Administrator Privileges" : "Running in standard mode. Start with 'start_admin.bat' for elevated privileges."}
          >
            {isAdmin ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            <span>{isAdmin ? 'Admin Active' : 'Standard User'}</span>
          </div>

          {/* Backend Online status */}
          <div 
            className="badge" 
            style={{ 
              background: backendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: backendOnline ? '#34d399' : '#f87171',
              border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}
            title={backendOnline ? "Backend is connected on :8000" : "Backend connection error"}
          >
            <span className="badge-dot" />
            <span>{backendOnline ? 'Connected' : 'Offline'}</span>
          </div>

          {/* History Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenHistory}
            title="View Command & Query History"
          >
            <History size={16} />
            <span>History</span>
          </button>

          {/* Settings Button */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenSettings}
            title="Configure Gemini API Key & Shell"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
}
