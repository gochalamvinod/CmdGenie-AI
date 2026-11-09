const API_BASE = '/api';

export const api = {
  // Health & Admin status
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend offline');
    return res.json();
  },

  async getAdminStatus() {
    const res = await fetch(`${API_BASE}/command/status`);
    if (!res.ok) throw new Error('Failed to fetch admin status');
    return res.json();
  },

  // File System
  async browseFolder(path) {
    const url = path ? `${API_BASE}/fs/browse?path=${encodeURIComponent(path)}` : `${API_BASE}/fs/browse`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to browse folder');
    return res.json();
  },

  async getQuickAccess() {
    const res = await fetch(`${API_BASE}/fs/quick-access`);
    if (!res.ok) throw new Error('Failed to fetch quick access');
    return res.json();
  },

  async pickNativeFolder(initialPath) {
    const res = await fetch(`${API_BASE}/fs/pick-native`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initial_path: initialPath }),
    });
    if (!res.ok) throw new Error('Native folder dialog failed');
    return res.json();
  },

  async validateFolder(path) {
    const res = await fetch(`${API_BASE}/fs/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    return res.json();
  },

  async getFolderStats(path) {
    const res = await fetch(`${API_BASE}/fs/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to inspect folder');
    }
    return res.json();
  },

  // AI & Execution
  async testApiKey(apiKey) {
    const res = await fetch(`${API_BASE}/ai/test-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    return res.json();
  },

  async askAi({ query, folderPath, apiKey, shellType = 'powershell', autoExecute = true, sessionId = null, conversationHistory = [] }) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout

    try {
      const res = await fetch(`${API_BASE}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query,
          folder_path: folderPath,
          api_key: apiKey,
          shell_type: shellType,
          auto_execute: autoExecute,
          session_id: sessionId,
          conversation_history: conversationHistory,
        }),
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'AI query failed');
      }
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Query timed out. The folder might be too large or the command took more than 40 seconds.');
      }
      throw err;
    }
  },

  async executeCommand({ command, folderPath, shellType = 'powershell' }) {
    const res = await fetch(`${API_BASE}/command/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        folder_path: folderPath,
        shell_type: shellType,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Command execution failed');
    }
    return res.json();
  },

  async synthesizeAnswer({ query, command, stdout, stderr, exitCode, folderPath, apiKey, conversationHistory = [] }) {
    const res = await fetch(`${API_BASE}/ai/synthesize-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        command,
        stdout,
        stderr,
        exit_code: exitCode,
        folder_path: folderPath,
        api_key: apiKey,
        conversation_history: conversationHistory,
      }),
    });
    if (!res.ok) throw new Error('Answer synthesis failed');
    return res.json();
  },

  // Multi-Turn Chat Sessions
  async getSessions() {
    const res = await fetch(`${API_BASE}/history/sessions`);
    if (!res.ok) return [];
    return res.json();
  },

  async getSessionMessages(sessionId) {
    const res = await fetch(`${API_BASE}/history/sessions/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error('Failed to load session');
    return res.json();
  },

  async deleteSession(sessionId) {
    const res = await fetch(`${API_BASE}/history/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' });
    return res.json();
  },

  async clearSessions() {
    const res = await fetch(`${API_BASE}/history/sessions`, { method: 'DELETE' });
    return res.json();
  },

  // Legacy History
  async getHistory() {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) return [];
    return res.json();
  },

  async deleteHistory(id) {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async clearHistory() {
    const res = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
    return res.json();
  },
};
