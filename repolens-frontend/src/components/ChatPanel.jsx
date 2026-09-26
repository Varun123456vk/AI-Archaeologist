import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  FileCode2,
  FunctionSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { sendChatMessage } from '../services/api';
import './ChatPanel.css';

const SUGGESTED_QUESTIONS = [
  'Where is the main entry point?',
  'Where is user authentication implemented?',
  'Which modules import the database service?',
  'Where should I modify the API endpoint for creating a user?',
  'Explain the relationship between routes and models.',
  'Which files are responsible for database access?',
];

export default function ChatPanel({ repositoryId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (question) => {
    const q = question || input.trim();
    if (!q || isLoading) return;

    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(repositoryId, q);
      const aiMsg = {
        role: 'assistant',
        content: response.answer || 'No answer returned from the analysis engine.',
        relevant_files: response.relevant_files || [],
        supporting_symbols: response.supporting_symbols || [],
        limitations: response.limitations || null,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: err.message || 'Failed to get a response. Please check the backend connection.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-panel">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div>
            <h2 className="chat-title flex items-center gap-2">
              <Sparkles size={18} style={{ color: 'var(--accent-primary)' }} />
              Ask RepoLens
            </h2>
            <p className="chat-subtitle">Ask questions about this repository.</p>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">
                <MessageSquare size={28} />
              </div>
              <h3>Ask about this codebase</h3>
              <p>
                Questions are answered using static analysis results from the repository.
                Answers are grounded in actual code — not hallucinated.
              </p>

              <div className="suggested-questions">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    className="suggested-question"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))
          )}

          {isLoading && (
            <div className="chat-message chat-message-assistant animate-fade-in">
              <div className="chat-avatar chat-avatar-bot">
                <Bot size={16} />
              </div>
              <div className="chat-bubble chat-bubble-assistant">
                <div className="chat-loading">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyzing repository…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <div className="chat-quick-chips">
            <span className="chip-label">Quick Modification Guides:</span>
            <button className="chip-btn" onClick={() => handleSend("Where should I modify authentication and user security?")}>
              🛠️ Modify Auth
            </button>
            <button className="chip-btn" onClick={() => handleSend("Where should I modify database schemas and models?")}>
              💾 Modify Models
            </button>
            <button className="chip-btn" onClick={() => handleSend("Where should I add a new API route or endpoint?")}>
              🔌 Add API Route
            </button>
            <button className="chip-btn" onClick={() => handleSend("Where is the main application entry point and server startup logic?")}>
              ⚡ Main Entry
            </button>
          </div>

          <div className="chat-input-container">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Ask 'Where should I modify X?' or any code question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="btn btn-primary chat-send-btn"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <p className="chat-disclaimer">
            Answers are generated using static AST analysis and Google Gemini AI.
          </p>
        </div>

      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`chat-message ${
        isUser ? 'chat-message-user' : 'chat-message-assistant'
      } animate-fade-in-up`}
    >
      <div className={`chat-avatar ${isUser ? 'chat-avatar-user' : 'chat-avatar-bot'}`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div
        className={`chat-bubble ${
          isUser ? 'chat-bubble-user' : 'chat-bubble-assistant'
        } ${message.isError ? 'chat-bubble-error' : ''}`}
      >
        <p className="chat-content">{message.content}</p>

        {/* Relevant files */}
        {message.relevant_files?.length > 0 && (
          <div className="chat-section">
            <div className="chat-section-title">
              <FileCode2 size={13} />
              Relevant Files
            </div>
            <div className="chat-files">
              {message.relevant_files.map((f, i) => (
                <span key={i} className="chat-file-tag mono">
                  <FileCode2 size={12} />
                  {typeof f === 'string' ? f : f.file_path || f.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Supporting symbols */}
        {message.supporting_symbols?.length > 0 && (
          <div className="chat-section">
            <div className="chat-section-title">
              <FunctionSquare size={13} />
              Supporting Symbols
            </div>
            <div className="chat-files">
              {message.supporting_symbols.map((s, i) => (
                <span key={i} className="chat-symbol-tag mono">
                  {typeof s === 'string' ? s : s.name || s.symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Limitations */}
        {message.limitations && (
          <div className="chat-limitations">
            <AlertCircle size={13} />
            <span>{message.limitations}</span>
          </div>
        )}
      </div>
    </div>
  );
}
