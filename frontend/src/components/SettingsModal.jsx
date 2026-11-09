import React, { useState } from 'react';
import { Settings, Key, Eye, EyeOff, Check, X, ShieldCheck, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, apiKey, onSaveApiKey, isAdmin }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!keyInput.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testApiKey(keyInput.trim());
      setTestResult(res);
    } catch (err) {
      setTestResult({ valid: false, error: err.message || 'Connection failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} color="#6366f1" />
            <span>Settings & Admin Configuration</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Gemini API Key */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '8px' }}>
              Google Gemini API Key
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showKey ? 'text' : 'password'}
                className="path-input"
                style={{ paddingRight: '90px' }}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy..."
              />
              <div style={{ position: 'absolute', right: '10px', display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ padding: '6px' }}
                  onClick={() => setShowKey(!showKey)}
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.8rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                <span>Get a free Gemini API Key</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTestKey}
                disabled={!keyInput.trim() || testing}
              >
                {testing ? <Loader2 size={13} className="spinner" /> : <Key size={13} />}
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testResult && (
              <div 
                style={{ 
                  marginTop: '12px',
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  background: testResult.valid ? 'var(--success-light)' : 'var(--danger-light)',
                  color: testResult.valid ? '#34d399' : '#f87171',
                  border: `1px solid ${testResult.valid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                }}
              >
                {testResult.valid ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={16} />
                    <span>Gemini API Connected Successfully! Model: {testResult.model || 'gemini-2.5-flash'}</span>
                  </div>
                ) : (
                  <div>Error: {testResult.error || 'Failed to authenticate'}</div>
                )}
              </div>
            )}
          </div>

          {/* Admin Privilege Status & Help */}
          <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {isAdmin ? (
                <ShieldCheck size={18} color="#34d399" />
              ) : (
                <ShieldAlert size={18} color="#fbbf24" />
              )}
              <strong style={{ fontSize: '0.9rem', color: isAdmin ? '#34d399' : '#fbbf24' }}>
                {isAdmin ? 'Administrator Access: Active' : 'Administrator Access: Standard User'}
              </strong>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              {isAdmin ? (
                'The Python backend is currently running with Windows Administrator privileges. It has unrestricted capability to execute all system queries, inspect protected folders, query services, and run elevated PowerShell commands.'
              ) : (
                'The backend is currently in standard user mode. Some restricted system folders (such as Windows, Program Files, or locked user folders) may deny access. To enable complete admin access, run "start_admin.bat" by right-clicking and selecting "Run as administrator".'
              )}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <Check size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
