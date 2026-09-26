import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  ArrowLeft,
  FileCode2,
  Box,
  Link2,
  FunctionSquare,
  Braces,
  AlertTriangle,
  Map,
  List,
  Crosshair,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Files,
} from 'lucide-react';
import ArchitectureGraph from '../components/ArchitectureGraph';
import ModuleExplorer from '../components/ModuleExplorer';
import EntryPoints from '../components/EntryPoints';
import ChatPanel from '../components/ChatPanel';
import ModuleDrawer from '../components/ModuleDrawer';
import './DashboardPage.css';

const TABS = [
  { id: 'graph', label: 'Architecture Map', icon: Map },
  { id: 'modules', label: 'Module Explorer', icon: List },
  { id: 'entries', label: 'Entry Points', icon: Crosshair },
  { id: 'chat', label: 'AI Q&A', icon: MessageSquare },
];

export default function DashboardPage({ analysisData, backendStatus, onNewAnalysis }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('graph');
  const [selectedModule, setSelectedModule] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Redirect if no data
  useEffect(() => {
    if (!analysisData) {
      navigate('/');
    }
  }, [analysisData, navigate]);

  if (!analysisData) return null;

  const stats = computeStats(analysisData);
  const repoName = extractRepoName(analysisData);

  const handleNodeClick = (moduleId) => {
    const norm = (str) => (str || '').replace(/[/\\]/g, '_').toLowerCase();
    const targetNorm = norm(moduleId);

    const mod = (analysisData.modules || []).find(
      (m) =>
        m.id === moduleId ||
        m.file_path === moduleId ||
        m.name === moduleId ||
        norm(m.id) === targetNorm ||
        norm(m.file_path) === targetNorm ||
        norm(m.name) === targetNorm
    ) || (analysisData.modules || [])[0];

    if (mod) {
      setSelectedModule(mod);
      setDrawerOpen(true);
    }
  };


  const handleModuleSelect = (mod) => {
    setSelectedModule(mod);
    setDrawerOpen(true);
  };

  const handleBack = () => {
    onNewAnalysis();
    navigate('/');
  };

  return (
    <div className="dashboard">
      {/* Top Navigation */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="flex items-center gap-3">
            <div className="dashboard-logo">
              <GitBranch size={18} />
            </div>
            <span className="dashboard-brand">RepoLens AI</span>
            <span className="dashboard-separator">/</span>
            <span className="dashboard-repo-name mono">{repoName}</span>
            <span className="badge badge-success" style={{ marginLeft: 8 }}>
              <CheckCircle2 size={10} />
              Analyzed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusDot status={backendStatus} />
            <button className="btn btn-secondary btn-sm" onClick={handleBack}>
              <ArrowLeft size={14} />
              Analyze Another
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="dashboard-stats">
        <div className="stats-grid stagger-children">
          <StatCard icon={Files} label="Total Files" value={stats.totalFiles} />
          <StatCard icon={FileCode2} label="Python Files" value={stats.pythonFiles} color="var(--accent-primary)" />
          <StatCard icon={Box} label="Modules" value={stats.modules} color="var(--node-module)" />
          <StatCard icon={Link2} label="Dependencies" value={stats.dependencies} color="var(--accent-secondary)" />
          <StatCard icon={FunctionSquare} label="Functions" value={stats.functions} color="var(--color-success)" />
          <StatCard icon={Braces} label="Classes" value={stats.classes} color="var(--node-model)" />
          <StatCard
            icon={AlertTriangle}
            label="Parsing Errors"
            value={stats.errors}
            color={stats.errors > 0 ? 'var(--color-error)' : 'var(--text-tertiary)'}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <div className="tabs-bar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === 'graph' && (
          <ArchitectureGraph
            data={analysisData}
            onNodeClick={handleNodeClick}
          />
        )}
        {activeTab === 'modules' && (
          <ModuleExplorer
            modules={analysisData.modules || []}
            onModuleSelect={handleModuleSelect}
          />
        )}
        {activeTab === 'entries' && (
          <EntryPoints
            entryPoints={analysisData.entry_points || []}
            modules={analysisData.modules || []}
            onModuleSelect={handleModuleSelect}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPanel repositoryId={analysisData.repository_id} />
        )}
      </main>

      {/* Module Drawer */}
      <ModuleDrawer
        module={selectedModule}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-header">
        <Icon size={16} style={{ color: color || 'var(--text-tertiary)' }} />
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-value" style={{ color: color || 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    online: 'var(--color-success)',
    offline: 'var(--color-error)',
    checking: 'var(--color-warning)',
  };
  return (
    <div className="flex items-center gap-2 text-xs" style={{ color: colors[status] }}>
      <span
        className="status-dot"
        style={{ background: colors[status] }}
      />
      {status === 'online' ? 'Engine Online' : status === 'offline' ? 'Engine Offline' : 'Checking…'}
    </div>
  );
}

/* ─── Helpers ─── */
function computeStats(data) {
  const modules = data.modules || [];
  return {
    totalFiles: data.total_files ?? modules.length,
    pythonFiles: data.python_files ?? modules.filter(m => (m.language || m.type || '').toLowerCase().includes('python') || (m.file_path || m.name || '').endsWith('.py')).length,
    modules: modules.length,
    dependencies: data.dependencies?.length ?? modules.reduce((acc, m) => acc + (m.imports?.length || 0), 0),
    functions: data.total_functions ?? modules.reduce((acc, m) => acc + (m.functions?.length || 0), 0),
    classes: data.total_classes ?? modules.reduce((acc, m) => acc + (m.classes?.length || 0), 0),
    errors: data.parsing_errors ?? data.errors ?? 0,
  };
}

function extractRepoName(data) {
  if (data.repository_name) return data.repository_name;
  if (data.repo_url) {
    const parts = data.repo_url.replace(/\.git$/, '').split('/');
    return parts.slice(-2).join('/');
  }
  return data.repository_id || 'repository';
}
