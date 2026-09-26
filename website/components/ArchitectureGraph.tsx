"use client"

import { useMemo, useCallback, useState, useRef, useEffect } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react"
import { Maximize2, Minimize2, Search, Layers, Zap, Server, Database } from "lucide-react"
import "@xyflow/react/dist/style.css"
import CustomNode from "./CustomNode"
import "./ArchitectureGraph.css"

const nodeTypes = { custom: CustomNode }

const NODE_COLORS: Record<string, string> = {
  entry: "#10b981",    // Emerald Green
  service: "#3b82f6",  // Vivid Blue
  model: "#ec4899",    // Hot Pink
  database: "#06b6d4", // Cyan
  auth: "#ef4444",     // Red
  config: "#f59e0b",   // Amber
  module: "#8b5cf6",   // Purple
  file: "#6366f1",     // Indigo
  default: "#6366f1",
}

export default function ArchitectureGraph({ data, onNodeClick }: { data: any; onNodeClick?: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const { allNodes, allEdges } = useMemo(() => {
    return buildStraightConnectedGraph(data)
  }, [data])

  const filteredNodes = useMemo(() => {
    return allNodes.filter((n: any) => {
      const label = (n.data?.label || "").toLowerCase()
      const type = n.data?.nodeType || ""
      const matchesSearch = !searchQuery || label.includes(searchQuery.toLowerCase())
      
      if (categoryFilter === "entry") return matchesSearch && n.data?.isEntry
      if (categoryFilter === "service") return matchesSearch && (type === "service" || type === "module")
      if (categoryFilter === "model") return matchesSearch && (type === "model" || type === "database" || type === "config")
      return matchesSearch
    })
  }, [allNodes, searchQuery, categoryFilter])

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n: any) => n.id)), [filteredNodes])

  const filteredEdges = useMemo(() => {
    return allEdges.filter((e: any) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target))
  }, [allEdges, filteredNodeIds])

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges)

  useEffect(() => {
    setNodes(filteredNodes)
    setEdges(filteredEdges)
  }, [filteredNodes, filteredEdges, setNodes, setEdges])

  const handleNodeClick = useCallback(
    (_: any, node: any) => {
      onNodeClick?.(node.data?.moduleId || node.id)
    },
    [onNodeClick]
  )

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {})
      }
      setIsFullscreen(true)
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`graph-container ${isFullscreen ? "graph-container-fullscreen" : ""}`}
    >
      <div className="graph-top-bar">
        <div className="graph-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Filter modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="graph-search-input"
          />
        </div>

        <div className="graph-filter-tabs">
          <button
            className={`filter-btn ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            <Layers size={13} /> All ({allNodes.length})
          </button>
          <button
            className={`filter-btn ${categoryFilter === "entry" ? "active" : ""}`}
            onClick={() => setCategoryFilter("entry")}
          >
            <Zap size={13} /> Entry Points
          </button>
          <button
            className={`filter-btn ${categoryFilter === "service" ? "active" : ""}`}
            onClick={() => setCategoryFilter("service")}
          >
            <Server size={13} /> Services
          </button>
          <button
            className={`filter-btn ${categoryFilter === "model" ? "active" : ""}`}
            onClick={() => setCategoryFilter("model")}
          >
            <Database size={13} /> Models & Utils
          </button>
        </div>

        <button
          className="graph-toolbar-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Full Screen" : "Full Screen View"}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          <span>{isFullscreen ? "Exit" : "Full Screen"}</span>
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#818cf8", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#818cf8",
            width: 14,
            height: 14,
          },
          labelStyle: { fill: "#c084fc", fontWeight: 700, fontSize: 10 },
          labelBgStyle: { fill: "#141420", rx: 6, ry: 6 },
          labelBgPadding: [6, 4],
        }}
      >
        <Background
          variant="dots"
          gap={24}
          size={1}
          color="rgba(255, 255, 255, 0.05)"
        />
        <Controls showInteractive={true} className="graph-controls" />
        <MiniMap
          nodeColor={(n: any) => n.data?.color || NODE_COLORS.default}
          maskColor="rgba(10, 10, 15, 0.9)"
          className="graph-minimap"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  )
}

function buildStraightConnectedGraph(data: any) {
  const rawNodes = data?.graph?.nodes?.length ? data.graph.nodes : (data?.modules || [])
  const modules = data?.modules || []
  const entryIds = new Set((data?.entry_points || []).map((e: any) => e.id || e.file_path || e.name))

  const norm = (str: string) => (str || "").replace(/[/\\]/g, "_").toLowerCase()

  const entryGroup: any[] = []
  const serviceGroup: any[] = []
  const modelGroup: any[] = []

  rawNodes.forEach((n: any) => {
    const id = n.id || n.file_path || n.name
    const targetNorm = norm(id)
    const mod = modules.find(
      (m: any) => m.id === id || m.file_path === id || m.name === id || norm(m.id) === targetNorm || norm(m.file_path) === targetNorm
    )

    const isEntry = entryIds.has(id) || (mod?.is_entry_point) || targetNorm.includes("main") || targetNorm.includes("app") || targetNorm.includes("server") || targetNorm.includes("index")
    const nodeType = guessType(id, mod, isEntry)

    const item = {
      id,
      label: n.label || mod?.name || id,
      mod,
      nodeType,
      isEntry,
      color: NODE_COLORS[nodeType] || NODE_COLORS.default,
    }

    if (isEntry) {
      entryGroup.push(item)
    } else if (nodeType === "service" || nodeType === "module" || nodeType === "auth") {
      serviceGroup.push(item)
    } else {
      modelGroup.push(item)
    }
  })

  if (entryGroup.length === 0 && serviceGroup.length > 0) {
    entryGroup.push(serviceGroup.shift())
  }

  const allNodes: any[] = []
  const ROW_GAP = 95

  const layoutColumn = (items: any[], startX: number) => {
    items.slice(0, 15).forEach((item, rowIdx) => {
      allNodes.push({
        id: item.id,
        type: "custom",
        position: { x: startX, y: rowIdx * ROW_GAP + 50 },
        data: {
          label: item.label,
          moduleId: item.id,
          nodeType: item.nodeType,
          color: item.color,
          isEntry: item.isEntry,
          functions: item.mod?.functions?.length || 0,
          classes: item.mod?.classes?.length || 0,
          imports: item.mod?.imports?.length || 0,
        },
      })
    })
  }

  layoutColumn(entryGroup, 0)     // Column 1: Entry Points
  layoutColumn(serviceGroup, 380) // Column 2: Services
  layoutColumn(modelGroup, 760)   // Column 3: Models & Utils

  const allEdges: any[] = []
  const validNodeIds = new Set(allNodes.map((n) => n.id))
  let edgeIdx = 0

  const col1Nodes = allNodes.filter((n) => n.position.x === 0)
  const col2Nodes = allNodes.filter((n) => n.position.x === 380)
  const col3Nodes = allNodes.filter((n) => n.position.x === 760)

  const addEdge = (srcId: string, tgtId: string, labelText: string, colorHex: string) => {
    if (!validNodeIds.has(srcId) || !validNodeIds.has(tgtId) || srcId === tgtId) return
    if (allEdges.some((e) => e.source === srcId && e.target === tgtId)) return

    allEdges.push({
      id: `edge-${edgeIdx++}`,
      source: srcId,
      target: tgtId,
      label: labelText,
      sourceHandle: "right-source",
      targetHandle: "left-target",
      animated: true,
      style: { stroke: colorHex, strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: colorHex },
      labelStyle: { fill: colorHex, fontWeight: 700, fontSize: 10 },
      labelBgStyle: { fill: "#141420", rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
    })
  }

  modules.forEach((m: any) => {
    const sourceId = m.id || m.file_path || m.name
    if (!validNodeIds.has(sourceId)) return

    (m.imports || []).forEach((imp: any) => {
      const impStr = typeof imp === "string" ? imp : imp.module || imp.statement || imp.name || ""
      for (const targetId of validNodeIds) {
        if (targetId !== sourceId && impStr.toLowerCase().includes(targetId.toLowerCase().replace(/\.[^/.]+$/, ""))) {
          addEdge(sourceId, targetId, "imports", "#818cf8")
          break
        }
      }
    })
  })

  col1Nodes.forEach((n1, idx) => {
    const targetService = col2Nodes[idx % Math.max(col2Nodes.length, 1)]
    if (targetService) {
      addEdge(n1.id, targetService.id, "invokes API", "#10b981")
    }
  })

  col2Nodes.forEach((n2, idx) => {
    const targetModel = col3Nodes[idx % Math.max(col3Nodes.length, 1)]
    if (targetModel) {
      addEdge(n2.id, targetModel.id, "queries data", "#3b82f6")
    }
  })

  return { allNodes, allEdges }
}

function guessType(id: string, mod: any, isEntry: boolean) {
  if (isEntry) return "entry"
  const name = (id || mod?.name || mod?.file_path || "").toLowerCase()
  if (name.includes("service") || name.includes("controller") || name.includes("handler") || name.includes("router") || name.includes("api")) return "service"
  if (name.includes("model") || name.includes("schema") || name.includes("entity")) return "model"
  if (name.includes("db") || name.includes("database") || name.includes("sql") || name.includes("store")) return "database"
  if (name.includes("auth") || name.includes("jwt") || name.includes("token") || name.includes("security")) return "auth"
  if (name.includes("config") || name.includes("env") || name.includes("setting")) return "config"
  return "module"
}
