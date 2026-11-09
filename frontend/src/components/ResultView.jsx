import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Sparkles, AlertTriangle, Clock, RefreshCw, Cpu } from 'lucide-react';

export default function ResultView({ result, onReRunCommand, isRunningCommand }) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedOut, setCopiedOut] = useState(false);

  if (!result) return null;

  const handleCopyCmd = () => {
    if (result.command) {
      navigator.clipboard.writeText(result.command);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    }
  };

  const handleCopyOut = () => {
    const text = (result.stdout || '') + (result.stderr ? `\nSTDERR:\n${result.stderr}` : '');
    navigator.clipboard.writeText(text);
    setCopiedOut(true);
    setTimeout(() => setCopiedOut(false), 2000);
  };

  return (
    <div className="result-container">
      {/* 1. Humanic AI Answer */}
      {result.human_answer && (
        <div className="human-answer-card">
          <div className="human-answer-header">
            <div className="human-answer-badge">
              <Sparkles size={16} color="#a5b4fc" />
              <span>Human Answer • Gemini Analysis</span>
            </div>
            {result.duration_ms !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <Clock size={13} />
                <span>Total time: {result.duration_ms}ms</span>
              </div>
            )}
          </div>

          <div className="human-answer-body">
            {result.human_answer.split('\n').map((paragraph, index) => {
              if (!paragraph.trim()) return <br key={index} />;
              // Simple markdown bold renderer
              const formatted = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              return (
                <p 
                  key={index} 
                  dangerouslySetInnerHTML={{ __html: formatted }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Generated Command Box */}
      {result.command && (
        <div className="command-card">
          <div className="command-header">
            <div className="command-tag">
              <Terminal size={14} />
              <span>Generated Shell Command</span>
            </div>

            <div className="command-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCmd}
                title="Copy Command to Clipboard"
              >
                {copiedCmd ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onReRunCommand(result.command)}
                disabled={isRunningCommand}
                title="Execute command again"
              >
                <RefreshCw size={14} className={isRunningCommand ? 'spinner' : ''} />
                <span>{isRunningCommand ? 'Running...' : 'Run Again'}</span>
              </button>
            </div>
          </div>

          <pre className="command-code-box">{result.command}</pre>

          {result.explanation && (
            <div className="command-explanation">
              <strong>Purpose: </strong>
              <span>{result.explanation}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Live Terminal Output */}
      {result.executed && (
        <div className="terminal-window">
          <div className="terminal-topbar">
            <div className="terminal-controls">
              <span className="terminal-dot dot-red" />
              <span className="terminal-dot dot-yellow" />
              <span className="terminal-dot dot-green" />
              <span className="terminal-title">powershell — {result.folder_path || 'terminal'}</span>
            </div>

            <div className="terminal-meta">
              {result.exit_code !== null && (
                <span className={`exit-pill ${result.exit_code === 0 ? 'exit-pill-success' : 'exit-pill-error'}`}>
                  Exit: {result.exit_code}
                </span>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyOut}
                title="Copy Terminal Output"
              >
                {copiedOut ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                <span>{copiedOut ? 'Copied' : 'Copy Output'}</span>
              </button>
            </div>
          </div>

          <div className="terminal-body">
            <div className="terminal-prompt-line">
              PS {result.folder_path}&gt; {result.command}
            </div>

            {result.stdout && (
              <div>{result.stdout}</div>
            )}

            {!result.stdout && !result.stderr && (
              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                [Command completed silently with no standard output]
              </div>
            )}

            {result.stderr && (
              <div className="terminal-stderr">
                <strong>STDERR:</strong>
                <div>{result.stderr}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
