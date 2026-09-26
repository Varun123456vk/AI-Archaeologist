import {
  Crosshair,
  Zap,
  Server,
  Shield,
  FileCode2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import './EntryPoints.css';

const ENTRY_ICONS = {
  main: Zap,
  api: Server,
  auth: Shield,
  cli: FileCode2,
  default: Crosshair,
};

const ENTRY_COLORS = {
  main: 'var(--color-success)',
  api: 'var(--accent-primary)',
  auth: 'var(--color-error)',
  cli: 'var(--accent-secondary)',
  default: 'var(--color-warning)',
};

export default function EntryPoints({ entryPoints = [], modules = [], onModuleSelect }) {
  // If no entry_points from API, try to detect from modules
  const entries = entryPoints.length > 0
    ? entryPoints
    : modules.filter((m) => m.is_entry_point || m.is_entry);

  if (entries.length === 0) {
    return (
      <div className="entry-points">
        <div className="entry-empty">
          <Crosshair size={36} style={{ color: 'var(--text-tertiary)' }} />
          <h3>No Entry Points Detected</h3>
          <p className="text-secondary text-sm">
            Entry point detection is heuristic-based. The backend did not identify
            any likely entry points for this repository.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="entry-points">
      <div className="entry-points-header">
        <div>
          <h2 className="entry-points-title flex items-center gap-2">
            <Crosshair size={18} style={{ color: 'var(--color-success)' }} />
            Likely Entry Points
          </h2>
          <p className="entry-points-subtitle">
            These are heuristically detected. They may not be exhaustive.
          </p>
        </div>

        <div className="entry-notice">
          <AlertCircle size={14} />
          Detection is heuristic-based
        </div>
      </div>

      <div className="entry-grid">
        {entries.map((entry, i) => (
          <EntryCard
            key={entry.id || entry.file_path || entry.name || i}
            entry={entry}
            modules={modules}
            onSelect={onModuleSelect}
          />
        ))}
      </div>
    </div>
  );
}

function EntryCard({ entry, modules, onSelect }) {
  const name = entry.name || entry.file_path || 'unknown';
  const entryType = guessEntryType(entry);
  const typeLabel = getTypeLabel(entryType);
  const Icon = ENTRY_ICONS[entryType] || ENTRY_ICONS.default;
  const color = ENTRY_COLORS[entryType] || ENTRY_COLORS.default;
  const description = entry.description || entry.reason || getDefaultDescription(entryType);

  const handleClick = () => {
    const mod = modules.find(
      (m) => m.id === (entry.id || entry.file_path) || m.file_path === entry.file_path || m.name === name
    );
    if (mod) onSelect(mod);
  };

  return (
    <button className="entry-card card" onClick={handleClick}>
      <div className="entry-card-type" style={{ color }}>
        {typeLabel}
      </div>

      <div className="entry-card-main">
        <div className="entry-card-icon" style={{ '--entry-color': color }}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className="entry-card-name mono">{name}</div>
          <div className="entry-card-desc">{description}</div>
        </div>
        <ArrowRight size={16} style={{ color: 'var(--text-tertiary)' }} />
      </div>

      <div className="entry-card-badge" style={{ '--entry-color': color }}>
        <Crosshair size={10} />
        Likely Entry Point
      </div>
    </button>
  );
}

function guessEntryType(entry) {
  const name = (entry.name || entry.file_path || '').toLowerCase();
  const type = (entry.type || entry.entry_type || '').toLowerCase();
  if (type.includes('main') || name.includes('main') || name.includes('__main__')) return 'main';
  if (type.includes('api') || name.includes('app') || name.includes('server')) return 'api';
  if (type.includes('auth') || name.includes('auth')) return 'auth';
  if (type.includes('cli') || name.includes('cli') || name.includes('command')) return 'cli';
  return 'default';
}

function getTypeLabel(type) {
  const labels = {
    main: 'MAIN ENTRY',
    api: 'API ENTRY',
    auth: 'AUTH ENTRY',
    cli: 'CLI ENTRY',
    default: 'ENTRY POINT',
  };
  return labels[type] || labels.default;
}

function getDefaultDescription(type) {
  const desc = {
    main: 'Likely application entry point',
    api: 'Creates application / serves API endpoints',
    auth: 'Authentication and authorization endpoints',
    cli: 'Command-line interface handler',
    default: 'Detected entry point',
  };
  return desc[type] || desc.default;
}
