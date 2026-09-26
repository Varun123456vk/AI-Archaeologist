"use client"

import { useState, useMemo } from "react"
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
  Code2,
  Layers,
} from "lucide-react"

export default function ModuleExplorer({
  modules = [],
  onModuleSelect,
}: {
  modules: any[]
  onModuleSelect?: (mod: any) => void
}) {
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  const filtered = useMemo(() => {
    let items = [...modules]

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (m) =>
          (m.name || "").toLowerCase().includes(q) ||
          (m.file_path || "").toLowerCase().includes(q) ||
          (m.type || "").toLowerCase().includes(q)
      )
    }

    switch (activeFilter) {
      case "entries":
        items = items.filter((m) => m.is_entry_point || m.is_entry)
        break
      case "high-dep":
        items = items.filter((m) => (m.imports?.length || 0) >= 2)
        break
      case "py":
        items = items.filter((m) => (m.file_path || m.name || "").endsWith(".py"))
        break
      case "js":
        items = items.filter((m) => /\.[jt]sx?$/.test(m.file_path || m.name || ""))
        break
    }

    return items
  }, [modules, search, activeFilter])

  return (
    <div style={{ background: "rgba(13, 15, 24, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "1.5rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box size={18} />
          </div>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
              Important Modules
              <span style={{ marginLeft: "8px", background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                {filtered.length} modules
              </span>
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "0.8125rem", margin: 0 }}>Core file components, line counts, and import centrality metrics</p>
          </div>
        </div>

        {/* Live Search Input */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", color: "#a1a1aa" }} />
          <input
            type="text"
            placeholder="Search modules or file paths..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "rgba(30, 30, 48, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              padding: "8px 14px 8px 36px",
              borderRadius: "10px",
              fontSize: "0.8125rem",
              width: "240px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Filter Category Chips */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <Filter size={14} style={{ color: "#a1a1aa", marginRight: "4px" }} />
        {[
          { id: "all", label: "All Modules" },
          { id: "entries", label: "⚡ Entry Points" },
          { id: "high-dep", label: "🔗 High Dependency" },
          { id: "py", label: "🐍 Python Files" },
          { id: "js", label: "🟨 JavaScript/TypeScript" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            style={{
              background: activeFilter === f.id ? "rgba(99, 102, 241, 0.25)" : "rgba(30, 30, 48, 0.6)",
              border: activeFilter === f.id ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.1)",
              color: activeFilter === f.id ? "#818cf8" : "#a1a1aa",
              padding: "5px 12px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid of Clean Module Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
        {filtered.length === 0 ? (
          <div style={{ color: "#71717a", textAlign: "center", gridColumn: "1 / -1", padding: "3rem 1rem" }}>
            <FileCode2 size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <p>No modules match your filter query.</p>
          </div>
        ) : (
          filtered.map((mod: any, idx: number) => {
            const isEntry = mod.is_entry_point || mod.is_entry
            const accentColor = isEntry ? "#10b981" : "#6366f1"

            return (
              <div
                key={idx}
                onClick={() => onModuleSelect?.(mod)}
                style={{
                  background: "rgba(24, 24, 36, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderLeft: `4px solid ${accentColor}`,
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
                className="hover:-translate-y-1 hover:border-indigo-500"
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: `color-mix(in srgb, ${accentColor} 18%, transparent)`, color: accentColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileCode2 size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.875rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mod.name || mod.file_path}
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {mod.file_path}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={14} style={{ color: "#71717a", flexShrink: 0 }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "0.75rem", color: "#a1a1aa", fontFamily: "monospace" }}>
                  {isEntry && (
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.625rem" }}>
                      ENTRY
                    </span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Link2 size={12} /> {mod.imports?.length || 0} imp
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <FunctionSquare size={12} /> {mod.functions?.length || 0} fn
                  </span>
                  {mod.line_count > 0 && (
                    <span>{mod.line_count} lines</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
