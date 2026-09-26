import { Handle, Position } from '@xyflow/react';
import {
  FileCode2,
  Box,
  Database,
  Shield,
  Settings,
  Zap,
  Server,
  Heart,
} from 'lucide-react';
import './CustomNode.css';

const TYPE_ICONS = {
  entry: Zap,
  module: Box,
  file: FileCode2,
  service: Server,
  model: Heart,
  database: Database,
  auth: Shield,
  config: Settings,
};

export default function CustomNode({ data, selected }) {
  const {
    label,
    nodeType = 'file',
    color = '#6366f1',
    isEntry = false,
    functions = 0,
    classes = 0,
  } = data;

  const Icon = TYPE_ICONS[nodeType] || FileCode2;

  return (
    <div
      className={`custom-node ${selected ? 'custom-node-selected' : ''}`}
      style={{ '--node-color': color }}
    >
      {/* Handles on all 4 positions for clean straight connections */}
      <Handle type="target" position={Position.Left} id="left-target" className="custom-handle" />
      <Handle type="target" position={Position.Top} id="top-target" className="custom-handle" />

      <div className="custom-node-header">
        <div className="custom-node-icon">
          <Icon size={14} />
        </div>
        <div className="custom-node-info">
          <div className="custom-node-label" title={label}>
            {label}
          </div>
          <div className="custom-node-sub">
            {isEntry && <span className="custom-node-badge">Entry</span>}
            {functions > 0 && <span>{functions} fn</span>}
            {classes > 0 && <span>{classes} cls</span>}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="right-source" className="custom-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="custom-handle" />
    </div>
  );
}
