import {
  X,
  FileCode2,
  FunctionSquare,
  Braces,
  Link2,
  ArrowDownLeft,
  Crosshair,
  Hash,
  ExternalLink,
  Box,
  Code2,
  Sparkles,
} from 'lucide-react';
import './ModuleDrawer.css';

export default function ModuleDrawer({ module, open, onClose }) {
  if (!open || !module) return null;

  const name = module.name || module.file_path || 'Unknown';
  const filePath = module.file_path || module.name || '';
  const language = module.language || 'Python';
  const moduleType = module.type || 'Python Module';
  const imports = module.imports || [];
  const functions = module.functions || [];
  const classes = module.classes || [];
  const dependencies = module.dependencies || [];
  const importedBy = module.imported_by || [];
  const isEntry = module.is_entry_point || module.is_entry;
  const summary = module.summary || module.description || null;
  const lineCount = module.line_count || module.lines || null;
  const repoUrl = module.repo_url || module.url || null;

  return (
    <>
      {/* Backdrop */}
      <div className="drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <aside className="drawer animate-slide-in-right">
        {/* Header */}
        <div className="drawer-header">
          <div className="flex items-center gap-3">
            <div className="drawer-icon">
              <FileCode2 size={18} />
            </div>
            <div>
              <h2 className="drawer-title mono">{name}</h2>
              <div className="drawer-subtitle">{moduleType}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {/* Meta */}
          <div className="drawer-meta-grid">
            <MetaItem label="File" value={filePath} icon={FileCode2} mono />
            <MetaItem label="Language" value={language} icon={Code2} />
            <MetaItem label="Type" value={moduleType} icon={Box} />
            {lineCount && <MetaItem label="Lines" value={lineCount} icon={Hash} />}
          </div>

          {/* Entry point badge */}
          {isEntry && (
            <div className="drawer-entry-badge">
              <Crosshair size={14} />
              <span>Likely Entry Point</span>
            </div>
          )}

          {/* AI Summary */}
          {summary && (
            <DrawerSection title="AI Summary" icon={Sparkles} color="var(--accent-primary)">
              <p className="drawer-summary">{summary}</p>
            </DrawerSection>
          )}

          {/* Imports */}
          {imports.length > 0 && (
            <DrawerSection title={`Imports (${imports.length})`} icon={Link2} color="var(--accent-secondary)">
              <div className="drawer-tag-list">
                {imports.map((imp, i) => (
                  <span key={i} className="drawer-tag drawer-tag-import mono">
                    {typeof imp === 'string' ? imp : imp.module || imp.name}
                  </span>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Functions */}
          {functions.length > 0 && (
            <DrawerSection title={`Functions (${functions.length})`} icon={FunctionSquare} color="var(--color-success)">
              <div className="drawer-symbol-list">
                {functions.map((fn, i) => {
                  const fnName = typeof fn === 'string' ? fn : fn.name;
                  const fnLine = typeof fn === 'object' ? fn.line || fn.lineno : null;
                  return (
                    <div key={i} className="drawer-symbol">
                      <FunctionSquare size={13} style={{ color: 'var(--color-success)' }} />
                      <span className="mono">{fnName}()</span>
                      {fnLine && <span className="drawer-line-num">L{fnLine}</span>}
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          {/* Classes */}
          {classes.length > 0 && (
            <DrawerSection title={`Classes (${classes.length})`} icon={Braces} color="var(--node-model)">
              <div className="drawer-symbol-list">
                {classes.map((cls, i) => {
                  const clsName = typeof cls === 'string' ? cls : cls.name;
                  const clsLine = typeof cls === 'object' ? cls.line || cls.lineno : null;
                  return (
                    <div key={i} className="drawer-symbol">
                      <Braces size={13} style={{ color: 'var(--node-model)' }} />
                      <span className="mono">{clsName}</span>
                      {clsLine && <span className="drawer-line-num">L{clsLine}</span>}
                    </div>
                  );
                })}
              </div>
            </DrawerSection>
          )}

          {/* Dependencies */}
          {dependencies.length > 0 && (
            <DrawerSection title={`Dependencies (${dependencies.length})`} icon={Link2} color="var(--node-service)">
              <div className="drawer-tag-list">
                {dependencies.map((dep, i) => (
                  <span key={i} className="drawer-tag drawer-tag-dep mono">
                    {typeof dep === 'string' ? dep : dep.name || dep.module}
                  </span>
                ))}
              </div>
            </DrawerSection>
          )}

          {/* Imported By */}
          {importedBy.length > 0 && (
            <DrawerSection title={`Imported By (${importedBy.length})`} icon={ArrowDownLeft} color="var(--text-secondary)">
              <div className="drawer-tag-list">
                {importedBy.map((ib, i) => (
                  <span key={i} className="drawer-tag drawer-tag-neutral mono">
                    {typeof ib === 'string' ? ib : ib.name || ib.file_path}
                  </span>
                ))}
              </div>
            </DrawerSection>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          {repoUrl ? (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm w-full"
              style={{ justifyContent: 'center' }}
            >
              <ExternalLink size={14} />
              View in Repository
            </a>
          ) : (
            <button
              className="btn btn-secondary btn-sm w-full"
              style={{ justifyContent: 'center' }}
              disabled
              title="Repository URL not available from backend"
            >
              <ExternalLink size={14} />
              View in Repository
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function DrawerSection({ title, icon: Icon, color, children }) {
  return (
    <div className="drawer-section">
      <div className="drawer-section-title">
        <Icon size={14} style={{ color }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function MetaItem({ label, value, icon: Icon, mono }) {
  return (
    <div className="drawer-meta-item">
      <Icon size={13} style={{ color: 'var(--text-tertiary)' }} />
      <span className="drawer-meta-label">{label}</span>
      <span className={`drawer-meta-value ${mono ? 'mono' : ''}`}>{value}</span>
    </div>
  );
}
