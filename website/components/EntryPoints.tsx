"use client"

import { Zap, Crosshair, FileCode2, ArrowRight, Code, Terminal, CheckCircle2 } from "lucide-react"

export default function EntryPoints({
  entryPoints = [],
  onSelect,
}: {
  entryPoints: any[]
  onSelect?: (mod: any) => void
}) {
  return (
    <div style={{ background: "rgba(13, 15, 24, 0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "16px", padding: "1.5rem" }}>
      {/* Header Banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "12px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.25)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={22} />
          </div>
          <div>
            <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem", margin: 0 }}>
              Execution Entry Points
              <span style={{ marginLeft: "10px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", padding: "2px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                {entryPoints.length} detected
              </span>
            </h3>
            <p style={{ color: "#a1a1aa", fontSize: "0.8125rem", margin: "4px 0 0" }}>
              Main application start files, HTTP API route handlers, and CLI initializers
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "0.8125rem", fontWeight: 600 }}>
          <CheckCircle2 size={16} /> AST Verified
        </div>
      </div>

      {/* Grid of Entry Point Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.25rem" }}>
        {entryPoints.length === 0 ? (
          <div style={{ color: "#71717a", textAlign: "center", gridColumn: "1 / -1", padding: "3rem 1rem" }}>
            <Crosshair size={36} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <p>No explicit entry points detected in this repository scan.</p>
          </div>
        ) : (
          entryPoints.map((entry: any, idx: number) => {
            const name = entry.name || entry.file_path || "Entry Point"
            const path = entry.file_path || name
            const functions = entry.functions || []

            return (
              <div
                key={idx}
                onClick={() => onSelect?.(entry)}
                style={{
                  background: "rgba(20, 22, 34, 0.95)",
                  border: "1.5px solid rgba(16, 185, 129, 0.35)",
                  borderRadius: "14px",
                  padding: "1.25rem",
                  cursor: "pointer",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.12)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Terminal size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: "#10b981", fontWeight: 800, fontSize: "0.95rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.type || "Application Entry Point"}
                      </div>
                    </div>
                  </div>

                  <ArrowRight size={16} style={{ color: "#10b981", flexShrink: 0 }} />
                </div>

                <div style={{ background: "rgba(10, 10, 15, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 12px", marginBottom: "1rem", overflow: "hidden" }}>
                  <div style={{ color: "#71717a", fontSize: "0.6875rem", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>File Path</div>
                  <div style={{ color: "#f4f4f5", fontFamily: "monospace", fontSize: "0.8125rem", wordBreak: "break-all", overflowWrap: "anywhere" }}>{path}</div>
                </div>

                {functions.length > 0 && (
                  <div>
                    <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Code size={12} /> Key Functions ({functions.length})
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {functions.slice(0, 5).map((f: any, fIdx: number) => (
                        <span
                          key={fIdx}
                          style={{
                            background: "rgba(99, 102, 241, 0.15)",
                            color: "#a5b4fc",
                            border: "1px solid rgba(99, 102, 241, 0.3)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontFamily: "monospace",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {typeof f === "string" ? f : f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
