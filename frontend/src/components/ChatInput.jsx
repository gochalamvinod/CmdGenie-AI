import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2 } from 'lucide-react';

export default function ChatInput({
  onSendMessage,
  isLoading,
  autoExecute,
  setAutoExecute,
  shellType,
  setShellType,
  isAdmin,
}) {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim());
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-bottom-wrapper">
      <div className="chat-input-container">
        {/* Clean Input Form */}
        <form onSubmit={handleSubmit} className="chat-form">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or command an action (e.g. 'how many files exist with name vinod')..."
            disabled={isLoading}
          />

          <button
            type="submit"
            className="chat-send-btn"
            disabled={!inputText.trim() || isLoading}
            title="Send (Enter)"
          >
            {isLoading ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <ArrowUp size={20} />
            )}
          </button>
        </form>

        {/* Minimal Toolbar */}
        <div className="chat-preferences-toolbar">
          <label className="chat-toggle" title="Automatically execute generated commands">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
            />
            <span>Auto-execute</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Shell:</span>
            <select
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.75rem',
                outline: 'none',
              }}
              value={shellType}
              onChange={(e) => setShellType(e.target.value)}
            >
              <option value="powershell">PowerShell {isAdmin ? '(Admin)' : ''}</option>
              <option value="cmd">CMD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
