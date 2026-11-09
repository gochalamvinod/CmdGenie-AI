import React, { useState } from 'react';
import { Sparkles, Terminal, Play, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function QueryBox({
  onSubmitQuery,
  isLoading,
  autoExecute,
  setAutoExecute,
  shellType,
  setShellType,
  isAdmin
}) {
  const [query, setQuery] = useState('');

  const sampleQueries = [
    "How many files exist with name vinod?",
    "Find the 5 largest files in this folder",
    "List files modified in the last 7 days",
    "Show all .log and .txt files recursively",
    "Search files containing text 'config'",
    "Check for duplicate file names",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmitQuery(query.trim());
    }
  };

  const handleSelectSample = (sample) => {
    setQuery(sample);
    if (!isLoading) {
      onSubmitQuery(sample);
    }
  };

  return (
    <div className="card">
      <div className="card-title">
        <Sparkles size={18} color="#a855f7" />
        <span>Ask Human Questions (Gemini AI Command Engine)</span>
      </div>

      <div className="query-box">
        {/* Search input form */}
        <form onSubmit={handleSubmit}>
          <div className="query-input-wrapper">
            <Sparkles size={20} className="query-search-icon" />
            <input
              type="text"
              className="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. How many files exist with name vinod?"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary query-submit-btn"
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Ask AI</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggestion Pills */}
        <div className="suggestions-grid">
          <span className="quick-label">Try Asking:</span>
          {sampleQueries.map((sample, i) => (
            <button
              key={i}
              type="button"
              className="suggestion-pill"
              onClick={() => handleSelectSample(sample)}
              disabled={isLoading}
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Query Controls & Options */}
        <div className="options-bar">
          <div className="options-left">
            <label className="toggle-label" title="Generate and immediately execute the command in terminal">
              <input
                type="checkbox"
                className="toggle-input"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
              />
              <span>Auto-execute generated command</span>
            </label>
          </div>

          <div className="options-right">
            <span>Execution Shell:</span>
            <select
              className="shell-select"
              value={shellType}
              onChange={(e) => setShellType(e.target.value)}
            >
              <option value="powershell">PowerShell {isAdmin ? '(Admin Privileges)' : ''}</option>
              <option value="cmd">Windows CMD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
