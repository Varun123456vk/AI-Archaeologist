import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Search,
  Network,
  Code2,
  MessageSquare,
  Crosshair,
  ArrowRight,
  Loader2,
  Zap,
  CircleDot,
  CheckCircle2,
  XCircle,
  Braces,
  BarChart3,
} from 'lucide-react';
import { analyzeRepository } from '../services/api';
import './LandingPage.css';

const SAMPLE_REPO = 'https://github.com/tiangolo/fastapi';

const FEATURES = [
  {
    icon: Network,
    title: 'Architecture Mapping',
    desc: 'Visualize module relationships and dependency graphs interactively.',
    color: 'var(--accent-primary)',
  },
  {
    icon: Braces,
    title: 'Python AST Analysis',
    desc: 'Deep static analysis of functions, classes, imports, and symbols.',
    color: 'var(--accent-secondary)',
  },
  {
    icon: MessageSquare,
    title: 'AI Codebase Q&A',
    desc: 'Ask natural-language questions grounded in actual repository code.',
    color: 'var(--node-model)',
  },
  {
    icon: Crosshair,
    title: 'Entry Point Detection',
    desc: 'Automatically identifies main entry points, API routes, and CLI handlers.',
    color: 'var(--color-success)',
  },
];

export default function LandingPage({ backendStatus, onAnalysisComplete }) {
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (url) => {
    const targetUrl = url || repoUrl;
    if (!targetUrl.trim()) {
      setError('Please enter a repository URL.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const data = await analyzeRepository(targetUrl.trim());
      onAnalysisComplete(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check the URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSample = () => {
    setRepoUrl(SAMPLE_REPO);
    handleAnalyze(SAMPLE_REPO);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isAnalyzing) {
      handleAnalyze();
    }
  };

  return (
    <div className="landing">
      {/* Subtle background grid */}
      <div className="landing-bg" />

      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner container">
          <div className="landing-brand flex items-center gap-3">
            <div className="landing-logo">
              <GitBranch size={20} />
            </div>
            <div>
              <div className="landing-brand-name">RepoLens AI</div>
              <div className="landing-brand-tagline">AI Codebase Archaeologist</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <StatusIndicator status={backendStatus} />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ gap: '6px' }}
            >
              <GitBranch size={14} />
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="landing-main container">
        <div className="hero-section animate-fade-in-up">
          {/* Badge */}
          <div className="hero-badge">
            <Zap size={13} />
            Local Analysis Engine · Python AST · AI-Powered
          </div>

          {/* Heading */}
          <h1 className="hero-title">
            Understand any codebase
            <br />
            <span className="hero-gradient-text">in minutes.</span>
          </h1>

          <p className="hero-subtitle">
            RepoLens AI maps architecture, dependencies, and key modules using
            static analysis and AI — helping you navigate unfamiliar codebases
            with confidence.
          </p>

          {/* Input */}
          <div className="hero-input-wrapper">
            <div className="hero-input-container">
              <Search size={18} className="hero-input-icon" />
              <input
                type="url"
                className="hero-input"
                placeholder="https://github.com/owner/repository"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={isAnalyzing}
                spellCheck={false}
                autoComplete="url"
              />
              <button
                className="btn btn-primary hero-analyze-btn"
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !repoUrl.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    Analyze Repository
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="hero-error animate-fade-in">
                <XCircle size={14} />
                {error}
              </div>
            )}

            <div className="hero-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSample}
                disabled={isAnalyzing}
              >
                <Code2 size={14} />
                Use Sample Repository
              </button>
              <span className="text-tertiary text-xs">
                e.g. https://github.com/tiangolo/fastapi
              </span>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="features-grid stagger-children">
          {FEATURES.map((f) => (
            <div
              className="feature-card card"
              key={f.title}
              onClick={() => handleAnalyze(repoUrl || SAMPLE_REPO)}
              style={{ cursor: 'pointer' }}
              title={`Click to analyze ${repoUrl || SAMPLE_REPO} with ${f.title}`}
            >
              <div
                className="feature-icon"
                style={{ '--feature-color': f.color }}
              >
                <f.icon size={20} />
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>


        {/* Stats */}
        <div className="landing-stats">
          <div className="stat-item">
            <BarChart3 size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>Static Analysis</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <Braces size={16} style={{ color: 'var(--accent-secondary)' }} />
            <span>Python AST Parsing</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <CircleDot size={16} style={{ color: 'var(--color-success)' }} />
            <span>Local / LAN Demo</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="landing-footer container">
        <span className="text-tertiary text-xs">
          RepoLens AI · Hackathon MVP · No cloud services required
        </span>
      </footer>
    </div>
  );
}

function StatusIndicator({ status }) {
  const config = {
    online: { color: 'var(--color-success)', icon: CheckCircle2, label: 'Backend Online' },
    offline: { color: 'var(--color-error)', icon: XCircle, label: 'Backend Offline' },
    checking: { color: 'var(--color-warning)', icon: Loader2, label: 'Checking…' },
  };
  const { color, icon: Icon, label } = config[status] || config.checking;

  return (
    <div className="status-indicator" style={{ '--status-color': color }}>
      <Icon
        size={14}
        style={{ color }}
        className={status === 'checking' ? 'animate-spin' : ''}
      />
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  );
}
