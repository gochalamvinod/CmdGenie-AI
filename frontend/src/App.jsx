import React, { useState, useEffect, useRef } from 'react';
import ChatNavbar from './components/ChatNavbar';
import FolderBar from './components/FolderBar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import FolderBrowserModal from './components/FolderBrowserModal';
import SettingsModal from './components/SettingsModal';
import HistoryDrawer from './components/HistoryDrawer';
import { api } from './services/api';
import { Sparkles, ArrowRight, AlertCircle, X, Search, FolderPlus, BarChart3, FileText } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState('C:\\Users\\gocha\\Desktop');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [backendHasKey, setBackendHasKey] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  
  const [folderStats, setFolderStats] = useState(null);
  const [quickLocations, setQuickLocations] = useState(null);

  const [autoExecute, setAutoExecute] = useState(true);
  const [shellType, setShellType] = useState('powershell');
  
  // Chat Session & Messages
  const [sessionId, setSessionId] = useState(() => 'sess_' + Date.now());
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkHealthAndLocations();
  }, []);

  useEffect(() => {
    if (currentPath) {
      loadFolderStats(currentPath);
    }
  }, [currentPath]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const checkHealthAndLocations = async () => {
    try {
      const health = await api.getHealth();
      setBackendOnline(true);
      setIsAdmin(health.is_admin || false);
      setBackendHasKey(health.has_api_key || false);

      const quick = await api.getQuickAccess();
      setQuickLocations(quick);
      if (quick.common && quick.common.length > 0) {
        const desktop = quick.common.find((c) => c.name === 'Desktop');
        if (desktop) {
          setCurrentPath(desktop.path);
        }
      }
    } catch (err) {
      console.warn('Backend not yet reachable:', err);
      setBackendOnline(false);
    }
  };

  const loadFolderStats = async (path) => {
    try {
      const stats = await api.getFolderStats(path);
      setFolderStats(stats);
    } catch (err) {
      setFolderStats({ error: err.message });
    }
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
    setErrorNotice('');
  };

  const hasUsableKey = Boolean((apiKey && apiKey.trim()) || backendHasKey);

  // Send message with multi-turn conversation history
  const handleSendMessage = async (userQuery) => {
    if (!hasUsableKey) {
      setIsSettingsOpen(true);
      setErrorNotice('Please provide your Gemini API Key in Settings to generate commands.');
      return;
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toISOString(),
    };

    // Build context from recent messages in this session
    const conversationHistory = messages.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      command: m.command,
      output: m.stdout,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setErrorNotice('');

    try {
      const res = await api.askAi({
        query: userQuery,
        folderPath: currentPath,
        apiKey: apiKey.trim(),
        shellType,
        autoExecute,
        sessionId,
        conversationHistory,
      });

      if (res.session_id) {
        setSessionId(res.session_id);
      }

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.human_answer || 'Command execution finished.',
        command: res.command,
        explanation: res.explanation,
        operation: res.operation || 'READ',
        is_destructive: res.is_destructive || false,
        stdout: res.stdout,
        stderr: res.stderr,
        exit_code: res.exit_code,
        duration_ms: res.duration_ms,
        folder_path: res.folder_path,
        executed: res.executed,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      loadFolderStats(currentPath);
    } catch (err) {
      console.error('Error handling AI query:', err);
      setErrorNotice(err.message || 'Failed to process AI query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReRunCommand = async (commandToRun) => {
    setIsRunningCommand(true);
    try {
      const execRes = await api.executeCommand({
        command: commandToRun,
        folderPath: currentPath,
        shellType,
      });

      const conversationHistory = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        command: m.command,
      }));

      let newAnswer = null;
      if (hasUsableKey) {
        try {
          const synRes = await api.synthesizeAnswer({
            query: 'Re-running command',
            command: commandToRun,
            stdout: execRes.stdout,
            stderr: execRes.stderr,
            exitCode: execRes.exit_code,
            folderPath: currentPath,
            apiKey: apiKey.trim(),
            conversationHistory,
          });
          newAnswer = synRes.answer;
        } catch (e) {
          console.warn('Re-synthesis skipped:', e);
        }
      }

      setMessages((prev) => {
        const last = [...prev];
        const lastIdx = last.findLastIndex((m) => m.sender === 'assistant');
        if (lastIdx !== -1) {
          last[lastIdx] = {
            ...last[lastIdx],
            text: newAnswer || last[lastIdx].text,
            stdout: execRes.stdout,
            stderr: execRes.stderr,
            exit_code: execRes.exit_code,
            duration_ms: execRes.duration_ms,
            executed: true,
          };
        }
        return last;
      });

      loadFolderStats(currentPath);
    } catch (err) {
      setErrorNotice(err.message || 'Command re-execution failed');
    } finally {
      setIsRunningCommand(false);
    }
  };

  // Start fresh chat session
  const handleNewChat = () => {
    setMessages([]);
    setSessionId('sess_' + Date.now());
    setErrorNotice('');
  };

  // Select past session from History drawer
  const handleSelectSession = async (sess) => {
    try {
      setSessionId(sess.session_id);
      if (sess.folder_path) {
        setCurrentPath(sess.folder_path);
      }
      const data = await api.getSessionMessages(sess.session_id);
      if (data && data.messages) {
        const mapped = data.messages.map((m) => ({
          id: m.id,
          sender: m.role,
          text: m.content,
          command: m.command,
          explanation: m.explanation,
          operation: m.operation || 'READ',
          stdout: m.stdout,
          stderr: m.stderr,
          exit_code: m.exit_code,
          duration_ms: m.duration_ms,
          folder_path: sess.folder_path,
          executed: Boolean(m.command),
          timestamp: m.timestamp,
        }));
        setMessages(mapped);
      }
    } catch (err) {
      console.error('Failed to load session messages:', err);
      setErrorNotice('Could not load session messages.');
    }
  };

  const starterCards = [
    {
      title: "List top 10 biggest txt files",
      subtitle: "Numbered list with sizes & paths",
      icon: <BarChart3 size={18} />,
      query: "LIST TOP 10 BIGGEST TXT FILES IN NESTED FOLDERS",
    },
    {
      title: "How many files exist with name vinod?",
      subtitle: "Name filter & count",
      icon: <Search size={18} />,
      query: "How many files exist with name vinod?",
    },
    {
      title: "Create folder 'project_backup'",
      subtitle: "CRUD: Create directory",
      icon: <FolderPlus size={18} />,
      query: "Create a new folder called project_backup",
    },
    {
      title: "Create file 'notes.txt'",
      subtitle: "CRUD: Create & write file",
      icon: <FileText size={18} />,
      query: "Create a file notes.txt with text 'Hello from CmdGenie AI'",
    },
  ];

  return (
    <div className="chat-app">
      {/* 1. Header */}
      <ChatNavbar
        isAdmin={isAdmin}
        backendOnline={backendOnline}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewChat={handleNewChat}
      />

      {/* 2. Folder Scope Banner */}
      <FolderBar
        currentPath={currentPath}
        onPathChange={(p) => setCurrentPath(p)}
        onOpenBrowser={() => setIsBrowserOpen(true)}
        folderStats={folderStats}
        onRefreshStats={() => loadFolderStats(currentPath)}
        quickLocations={quickLocations}
      />

      {/* Global Error Banner */}
      {errorNotice && (
        <div 
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
            zIndex: 25,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorNotice}</span>
          </div>
          <button
            type="button"
            className="btn-icon"
            style={{ padding: '3px' }}
            onClick={() => setErrorNotice('')}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Chat Messages Scroll Area */}
      <div className="chat-feed">
        {messages.length === 0 ? (
          <div className="empty-chat-hero">
            <div className="hero-sparkle">
              <Sparkles size={32} color="#818cf8" />
            </div>
            <h1 className="hero-title">How can I assist you with your files?</h1>
            <p className="hero-subtitle">
              Ask questions or command actions on your PC. I remember our conversation context for follow-ups like <em>"I said list"</em> or <em>"delete the first one"</em>.
            </p>

            <div className="starter-prompts">
              {starterCards.map((card, idx) => (
                <div
                  key={idx}
                  className="starter-card"
                  onClick={() => handleSendMessage(card.query)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary)', display: 'flex' }}>
                      {card.icon}
                    </div>
                    <div>
                      <div className="starter-card-text">{card.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {card.subtitle}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="starter-card-icon" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onReRunCommand={handleReRunCommand}
              isRunningCommand={isRunningCommand}
            />
          ))
        )}

        {/* Loading / Typing indicator */}
        {isLoading && (
          <div className="message-row">
            <div className="message-avatar avatar-ai">
              <Sparkles size={18} />
            </div>
            <div className="message-content-wrapper">
              <div className="assistant-bubble" style={{ width: 'fit-content', padding: '12px 18px' }}>
                <div className="typing-indicator">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Chat Bottom Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        autoExecute={autoExecute}
        setAutoExecute={setAutoExecute}
        shellType={shellType}
        setShellType={setShellType}
        isAdmin={isAdmin}
      />

      {/* Modals */}
      <FolderBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        currentPath={currentPath}
        onSelectFolder={(p) => setCurrentPath(p)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        isAdmin={isAdmin}
      />

      {/* Chat Sessions History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        activeSessionId={sessionId}
      />
    </div>
  );
}
