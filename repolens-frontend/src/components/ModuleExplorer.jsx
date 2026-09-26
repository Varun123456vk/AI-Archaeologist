import { useState, useMemo } from 'react';
import {
  Search,
  FileCode2,
  Box,
  Crosshair,
  Link2,
  FunctionSquare,
  Braces,
  ArrowRight,
  Filter,
} from 'lucide-react';
import './ModuleExplorer.css';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'entries', label: 'Entry Points' },
  { id: 'high-dep', label: 'High Dependency' },
  { id: 'modules', label: 'Modules' },
  { id: 'files', label: 'Files' },
];

export default function ModuleExplorer({ modules = [], onModuleSelect }) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = useMemo(() => {
    let items = [...modules];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(q) ||
          (m.file_path || '').toLowerCase().includes(q) ||
          (m.type || '').toLowerCase().includes(q)
      );
    }

    // Category filter
    switch (activeFilter) {
      case 'entries':
        items = items.filter((m) => m.is_entry_point || m.is_entry);
        break;
      case 'high-dep':
        items = items.filter((m) => (m.imports?.length || 0) >= 3);
        break;
      case 'modules':
        items = items.filter(
          (m) =>
            (m.type || '').toLowerCase().includes('module') ||
            (m.file_path || m.name || '').includes('/')
        );
        break;
      case 'files':
        items = items.filter(
          (m) =>
            (m.type || '').toLowerCase().includes('file') ||
            (m.file_path || m.name || '').endsWith('.py')
        );
        break;
    }

    return items;
  }, [modules, search, activeFilter]);

  return (
    <div className="module-explorer">
      <div className="module-explorer-header">
        <h2 className="module-explorer-title">
          <Box size={18} style={{ color: 'var(--accent-primary)' }} />
          Important Modules
          <span className="module-count badge badge-neutral">
            {filtered.length}
          </span>
        </h2>

        {/* Search */}
        <div className="module-search-container">
          <Search size={15} className="module-search-icon" />
          <input
            type="text"
            className="module-search-input"
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="module-filters">
        <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${activeFilter === f.id ? 'filter-active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Module List */}
      <div className="module-list">
        {filtered.length === 0 ? (
          <div className="module-empty">
            <FileCode2 size={32} style={{ color: 'var(--text-tertiary)' }} />
            <p>No modules match your filters.</p>
          </div>
        ) : (
          filtered.map((mod) => (
            <ModuleCard
              key={mod.id || mod.file_path || mod.name}
              module={mod}
              onClick={() => onModuleSelect(mod)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ModuleCard({ module, onClick }) {
  const name = module.name || module.file_path || 'Unknown';
  const type = module.type || 'Python Module';
  const imports = module.imports?.length || 0;
  const functions = module.functions?.length || 0;
  const classes = module.classes?.length || 0;
  const isEntry = module.is_entry_point || module.is_entry;

  return (
    <button className="module-card card" onClick={onClick}>
      <div className="module-card-top">
        <div className="flex items-center gap-3">
          <div className={`module-card-icon ${isEntry ? 'module-card-icon-entry' : ''}`}>
            <FileCode2 size={16} />
          </div>
          <div>
            <div className="module-card-name mono">{name}</div>
            <div className="module-card-type">{type}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEntry && (
            <span className="badge badge-success">
              <Crosshair size={10} />
              Entry
            </span>
          )}
          <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
        </div>
      </div>

      <div className="module-card-stats">
        <span className="module-card-stat">
          <Link2 size={12} />
          {imports} imports
        </span>
        <span className="module-card-stat">
          <FunctionSquare size={12} />
          {functions} functions
        </span>
        <span className="module-card-stat">
          <Braces size={12} />
          {classes} classes
        </span>
      </div>
    </button>
  );
}
