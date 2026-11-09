import React, { useState } from 'react';
import { User, Sparkles, Terminal, Copy, Check, RefreshCw, ChevronDown, ChevronRight, Clock, FilePlus, FileEdit, Trash2, Eye, Code } from 'lucide-react';

export default function ChatMessage({ message, onReRunCommand, isRunningCommand }) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedOut, setCopiedOut] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="message-row message-user-row">
        <div className="message-content-wrapper" style={{ alignItems: 'flex-end' }}>
          <div className="user-bubble">{message.text}</div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', paddingRight: '4px' }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="message-avatar avatar-user">
          <User size={18} />
        </div>
      </div>
    );
  }

  const handleCopyCmd = (e) => {
    e?.stopPropagation();
    if (message.command) {
      navigator.clipboard.writeText(message.command);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  const handleCopyOut = (e) => {
    e?.stopPropagation();
    const text = (message.stdout || '') + (message.stderr ? `\nSTDERR:\n${message.stderr}` : '');
    navigator.clipboard.writeText(text);
    setCopiedOut(true);
    setTimeout(() => setCopiedOut(false), 2000);
  };

  // CRUD Operation badge
  const getCrudBadge = (op) => {
    switch (op?.toUpperCase()) {
      case 'CREATE':
        return { label: 'Created', icon: <FilePlus size={11} />, bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'UPDATE':
        return { label: 'Updated', icon: <FileEdit size={11} />, bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'DELETE':
        return { label: 'Deleted', icon: <Trash2 size={11} />, bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      default:
        return null; // Don't clutter read queries with an extra badge
    }
  };

  const crud = getCrudBadge(message.operation);

  return (
    <div className="message-row">
      <div className="message-avatar avatar-ai">
        <Sparkles size={18} />
      </div>

      <div className="message-content-wrapper">
        <div className="assistant-bubble" style={{ gap: '10px', padding: '14px 18px' }}>
          {/* Optional Action Tag if Create/Update/Delete */}
          {crud && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '2px 7px', 
                  borderRadius: '4px', 
                  fontSize: '0.7rem', 
                  fontWeight: 700, 
                  background: crud.bg, 
                  color: crud.color, 
                  border: `1px solid ${crud.border}` 
                }}
              >
                {crud.icon}
                <span>{crud.label}</span>
              </div>
            </div>
          )}

          {/* 1. Concise, direct human answer */}
          {message.text && (
            <div className="ai-human-answer" style={{ fontSize: '0.975rem' }}>
              {message.text.split('\n').map((paragraph, index) => {
                if (!paragraph.trim()) return <br key={index} />;
                const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return (
                  <p 
                    key={index} 
                    dangerouslySetInnerHTML={{ __html: formatted }}
                  />
                );
              })}
            </div>
          )}

          {/* 2. Technical details toggle (HIDDEN by default, click to see command & terminal) */}
          {message.command && (
            <div style={{ marginTop: '4px' }}>
              <div
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all 0.15s',
                }}
                title="Click to view executed shell command and terminal output"
              >
                {isDetailsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <Terminal size={12} color="#818cf8" />
                <span>Command & Terminal Output</span>
                {message.exit_code !== null && (
                  <span style={{ color: message.exit_code === 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    • Exit: {message.exit_code}
                  </span>
                )}
                {message.duration_ms !== undefined && (
                  <span>• {message.duration_ms}ms</span>
                )}
              </div>

              {/* Collapsed/Expanded Technical View */}
              {isDetailsOpen && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* PowerShell Command */}
                  <div className="chat-command-accordion">
                    <div className="accordion-header" style={{ padding: '6px 12px' }}>
                      <div className="accordion-title" style={{ fontSize: '0.75rem' }}>
                        <Terminal size={12} />
                        <span>PowerShell</span>
                      </div>
                      <div className="accordion-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                          onClick={handleCopyCmd}
                        >
                          {copiedCmd ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                          <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                          onClick={() => onReRunCommand(message.command)}
                          disabled={isRunningCommand}
                        >
                          <RefreshCw size={11} className={isRunningCommand ? 'spinner' : ''} />
                          <span>Run Again</span>
                        </button>
                      </div>
                    </div>
                    <pre className="command-code-view" style={{ fontSize: '0.8rem', padding: '10px 12px' }}>
                      {message.command}
                    </pre>
                  </div>

                  {/* Terminal Output */}
                  {message.executed && (
                    <div className="chat-terminal-box">
                      <div className="terminal-header-bar" style={{ padding: '6px 12px' }}>
                        <span className="terminal-title-text" style={{ fontSize: '0.72rem' }}>Terminal Output</span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 7px', fontSize: '0.7rem' }}
                          onClick={handleCopyOut}
                        >
                          {copiedOut ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                          <span>{copiedOut ? 'Copied' : 'Copy Output'}</span>
                        </button>
                      </div>
                      <div className="terminal-stream" style={{ fontSize: '0.775rem', padding: '10px 12px', maxHeight: '180px' }}>
                        {message.stdout && <div>{message.stdout}</div>}
                        {!message.stdout && !message.stderr && (
                          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                            [Completed silently with no output]
                          </div>
                        )}
                        {message.stderr && (
                          <div className="terminal-stream-err">{message.stderr}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
