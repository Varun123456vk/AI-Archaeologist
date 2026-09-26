"use client"

import { Canvas } from "@react-three/fiber"
import { TorusShader } from "@/components/torus-shader"
import ArchitectureGraph from "@/components/ArchitectureGraph"
import ModuleExplorer from "@/components/ModuleExplorer"
import EntryPoints from "@/components/EntryPoints"
import GitHubAuthModal, { GitHubUser } from "@/components/GitHubAuthModal"
import { useState, useEffect, useRef } from "react"
import {
  Search,
  Map,
  Layers,
  Zap,
  ArrowRight,
  ArrowLeft,
  Github,
  Check,
  Network,
  Compass,
  Shield,
  BookOpen,
  Sparkles,
  MousePointerClick,
  Cpu,
  Loader2,
  FileCode2,
  Box,
  Link2,
  FunctionSquare,
  Braces,
  MessageSquare,
  Send,
  XCircle,
  CheckCircle2,
  Crosshair,
  List,
} from "lucide-react"

// ─── Animated Counter ────────────────────────────────────────────
function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) 
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [hasStarted, end, duration])

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}

// ─── Scroll Reveal Wrapper ───────────────────────────────────────
function Reveal({ children, delay = 0, direction = "up", className = "" }: { children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" | "scale"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  const directionClass = {
    up: "reveal--up",
    left: "reveal--left",
    right: "reveal--right",
    scale: "reveal--scale",
  }[direction]

  return (
    <div
      ref={ref}
      className={`reveal ${directionClass} ${isVisible ? "reveal--visible" : ""} ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Feature Card Component ─────────────────────────────────────
function InteractiveFeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  onClick,
}: {
  icon: any
  title: string
  description: string
  delay?: number
  onClick?: () => void
}) {
  return (
    <Reveal delay={delay} direction="up">
      <div className="feature-card cursor-pointer" onClick={onClick}>
        <div className="feature-card-glow" />
        <div className="feature-card-content">
          <div className="feature-icon-wrapper">
            <Icon className="feature-icon" size={24} />
          </div>
          <h3 className="feature-title">{title}</h3>
          <p className="feature-description">{description}</p>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Main Page Component ──────────────────────────────────────────
export default function Page() {
  const [scrolled, setScrolled] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // GitHub Login Auth State
  const [authUser, setAuthUser] = useState<GitHubUser | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Page View Routing State: 'landing' (First Page) vs 'dashboard' (Dashboard View)
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing")
  const [activeTab, setActiveTab] = useState("graph")
  const [selectedModule, setSelectedModule] = useState<any>(null)

  // Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem("repolens_github_user")
    if (savedUser) {
      try {
        setAuthUser(JSON.parse(savedUser))
      } catch (e) {}
    }

    // Check for GitHub OAuth callback parameters in URL
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const userParam = urlParams.get("user") || urlParams.get("username")

      if (code || userParam) {
        const handle = userParam || "octocat"
        fetch(`https://api.github.com/users/${handle}`)
          .then((res) => res.json())
          .then((ghData) => {
            if (ghData.login) {
              fetch(`https://api.github.com/users/${handle}/repos?sort=updated&per_page=30`)
                .then((r) => r.json())
                .then((reposData) => {
                  const userRepos = Array.isArray(reposData) ? reposData.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    full_name: r.full_name,
                    html_url: r.html_url,
                    description: r.description || "",
                    language: r.language || "Code",
                    stargazers_count: r.stargazers_count || 0,
                    updated_at: r.updated_at,
                  })) : []

                  const user: GitHubUser = {
                    name: ghData.name || ghData.login,
                    username: ghData.login,
                    avatar: ghData.avatar_url,
                    email: ghData.email || `${ghData.login}@users.noreply.github.com`,
                    reposCount: ghData.public_repos || userRepos.length,
                    bio: ghData.bio || "GitHub Account User",
                    repos: userRepos,
                  }

                  localStorage.setItem("repolens_github_user", JSON.stringify(user))
                  setAuthUser(user)
                  window.history.replaceState({}, document.title, window.location.pathname)
                })
            }
          })
          .catch(() => {})
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem("repolens_github_user")
    setAuthUser(null)
    setIsUserMenuOpen(false)
    setChatMessages([])
    setChatInput("")
  }

  const handleAnalyze = async (url?: string) => {
    const repoUrl = url || inputValue.trim() || "https://github.com/expressjs/express"
    setError(null)
    setIsAnalyzing(true)

    try {
      const res = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Analysis failed.")
      }

      const data = await res.json()
      setAnalysisData(data)
      setChatMessages([])
      setChatInput("")
      // Switch view mode to dedicated Dashboard
      setViewMode("dashboard")
      setActiveTab("graph")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      setError(err.message || "Failed to connect to backend engine.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSendChat = async (qText?: string) => {
    const question = qText || chatInput.trim()
    if (!question || isChatLoading || !analysisData) return

    setChatMessages((prev) => [...prev, { role: "user", content: question }])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repository_id: analysisData.repository_id,
          question,
        }),
      })

      const reply = await res.json()
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply.answer || "No response received.",
          files: reply.relevant_files || [],
        },
      ])
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to connect to AI engine." },
      ])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleBackToLanding = () => {
    setViewMode("landing")
    setAnalysisData(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW 2: DASHBOARD PAGE (Opened after entering repository URL)
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === "dashboard" && analysisData) {
    return (
      <div className="page-root" style={{ background: "#07080e", minHeight: "100vh", color: "#f8fafc", position: "relative" }}>
        {/* Subtle Ambient Radial Lighting */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "500px",
            background: "radial-gradient(1000px circle at 50% -100px, rgba(99, 102, 241, 0.12), transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Faint Cybernetic Dot Grid Overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Top Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10, 10, 18, 0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "0.85rem 1.5rem" }}>
          <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(99,102,241,0.4), rgba(168,85,247,0.4))", border: "1px solid rgba(168,85,247,0.5)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
                A
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.02em" }}>Archaeologist</span>
              <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
              <span style={{ color: "#a5b4fc", fontFamily: "monospace", fontWeight: 700, fontSize: "0.95rem" }}>{analysisData.repository_name}</span>
              <span style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.35)", padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                <CheckCircle2 size={13} /> AST Analyzed
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={handleBackToLanding}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "8px 16px", borderRadius: "10px", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
              >
                <ArrowLeft size={16} /> Analyze Another Repo
              </button>

              {authUser ? (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "4px 12px 4px 6px", borderRadius: "999px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <img src={authUser.avatar} alt={authUser.name} style={{ width: "26px", height: "26px", borderRadius: "50%" }} />
                    <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#f8fafc" }}>@{authUser.username}</span>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
                  </button>

                  {isUserMenuOpen && (
                    <div style={{ position: "absolute", top: "120%", right: 0, width: "280px", background: "#0d0f17", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "16px", padding: "14px", zIndex: 99999, boxShadow: "0 10px 35px rgba(0,0,0,0.8)" }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{authUser.name}</div>
                      <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" }}>@{authUser.username} • {authUser.reposCount || authUser.repos?.length || 0} Repos</div>
                      
                      {/* Available Repositories List */}
                      <div style={{ margin: "10px 0 8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                        <div style={{ color: "#818cf8", fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                          📁 Your GitHub Repositories ({authUser.repos?.length || 0})
                        </div>
                        <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                          {(authUser.repos && authUser.repos.length > 0) ? (
                            authUser.repos.map((r: any) => (
                              <button
                                key={r.id || r.name}
                                onClick={() => {
                                  setIsUserMenuOpen(false)
                                  handleAnalyze(r.html_url)
                                }}
                                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 10px", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }}
                              >
                                <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.78125rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.name}
                                </div>
                                <div style={{ color: "#94a3b8", fontSize: "0.6875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {r.description || r.language || "GitHub Repository"}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div style={{ color: "#64748b", fontSize: "0.75rem", fontStyle: "italic", padding: "4px 0" }}>No public repos fetched.</div>
                          )}
                        </div>
                      </div>

                      <button onClick={handleSignOut} style={{ width: "100%", marginTop: "6px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "7px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  style={{ background: "#24292e", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 16px", borderRadius: "10px", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Github size={15} /> Sign in with GitHub
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem" }}>
          {/* Gemini AI Architectural Insights Banner */}
          {analysisData.ai_summary && (
            <div style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.12))", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "14px", padding: "1.25rem 1.5rem", marginBottom: "1.5rem", backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <Sparkles size={18} style={{ color: "#a5b4fc" }} />
                <h3 style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", margin: 0, letterSpacing: "-0.01em" }}>
                  Google Gemini Architectural Analysis
                </h3>
                <span style={{ background: "rgba(99, 102, 241, 0.25)", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.4)", padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>
                  AI Generated
                </span>
              </div>
              <p style={{ color: "#cbd5e1", fontSize: "0.875rem", lineHeight: "1.6", margin: 0 }}>
                {analysisData.ai_summary}
              </p>
            </div>
          )}

          {/* Summary Metric Cards with Glowing Borders */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "rgba(18, 18, 30, 0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "14px", padding: "1.1rem" }}>
              <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>TOTAL FILES</div>
              <div style={{ color: "#fff", fontSize: "1.85rem", fontWeight: 800, marginTop: "2px" }}>{analysisData.total_files}</div>
            </div>
            <div style={{ background: "rgba(18, 18, 30, 0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "1.1rem" }}>
              <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>FUNCTIONS</div>
              <div style={{ color: "#10b981", fontSize: "1.85rem", fontWeight: 800, marginTop: "2px" }}>{analysisData.total_functions}</div>
            </div>
            <div style={{ background: "rgba(18, 18, 30, 0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", padding: "1.1rem" }}>
              <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>MODULES</div>
              <div style={{ color: "#818cf8", fontSize: "1.85rem", fontWeight: 800, marginTop: "2px" }}>{analysisData.modules?.length || 0}</div>
            </div>
            <div style={{ background: "rgba(18, 18, 30, 0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "14px", padding: "1.1rem" }}>
              <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>ENTRY POINTS</div>
              <div style={{ color: "#f59e0b", fontSize: "1.85rem", fontWeight: 800, marginTop: "2px" }}>{analysisData.entry_points?.length || 0}</div>
            </div>
            <div style={{ background: "rgba(18, 18, 30, 0.75)", backdropFilter: "blur(16px)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "14px", padding: "1.1rem" }}>
              <div style={{ color: "#a1a1aa", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em" }}>DEPENDENCIES</div>
              <div style={{ color: "#ec4899", fontSize: "1.85rem", fontWeight: 800, marginTop: "2px" }}>{analysisData.dependencies?.length || 0}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: "0.85rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setActiveTab("graph")}
              style={{
                background: activeTab === "graph" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.35))" : "rgba(255, 255, 255, 0.04)",
                border: activeTab === "graph" ? "1px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.08)",
                color: activeTab === "graph" ? "#fff" : "#a1a1aa",
                padding: "9px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: activeTab === "graph" ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Map size={16} /> Architecture Map
            </button>
            <button
              onClick={() => setActiveTab("modules")}
              style={{
                background: activeTab === "modules" ? "linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.35))" : "rgba(255, 255, 255, 0.04)",
                border: activeTab === "modules" ? "1px solid #818cf8" : "1px solid rgba(255, 255, 255, 0.08)",
                color: activeTab === "modules" ? "#fff" : "#a1a1aa",
                padding: "9px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: activeTab === "modules" ? "0 0 20px rgba(99, 102, 241, 0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <List size={16} /> Important Modules ({analysisData.modules?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("entries")}
              style={{
                background: activeTab === "entries" ? "linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.35))" : "rgba(255, 255, 255, 0.04)",
                border: activeTab === "entries" ? "1px solid #10b981" : "1px solid rgba(255, 255, 255, 0.08)",
                color: activeTab === "entries" ? "#fff" : "#a1a1aa",
                padding: "9px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: activeTab === "entries" ? "0 0 20px rgba(16, 185, 129, 0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <Crosshair size={16} /> Entry Points ({analysisData.entry_points?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              style={{
                background: activeTab === "chat" ? "linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(236, 72, 153, 0.35))" : "rgba(255, 255, 255, 0.04)",
                border: activeTab === "chat" ? "1px solid #c084fc" : "1px solid rgba(255, 255, 255, 0.08)",
                color: activeTab === "chat" ? "#fff" : "#a1a1aa",
                padding: "9px 20px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: activeTab === "chat" ? "0 0 20px rgba(168, 85, 247, 0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              <MessageSquare size={16} /> Ask Gemini AI
            </button>
          </div>

          {/* TAB 1: ARCHITECTURE MAP */}
          {activeTab === "graph" && (
            <div style={{ height: "calc(100vh - 260px)", minHeight: "650px" }}>
              <ArchitectureGraph data={analysisData} onNodeClick={(modId) => {
                const mod = (analysisData.modules || []).find((m: any) => m.id === modId || m.file_path === modId || m.name === modId)
                if (mod) setSelectedModule(mod)
              }} />
            </div>
          )}

          {/* TAB 2: IMPORTANT MODULES */}
          {activeTab === "modules" && (
            <ModuleExplorer
              modules={analysisData.modules || []}
              onModuleSelect={(mod) => setSelectedModule(mod)}
            />
          )}

          {/* TAB 3: ENTRY POINTS */}
          {activeTab === "entries" && (
            <EntryPoints
              entryPoints={analysisData.entry_points || []}
              onSelect={(mod) => setSelectedModule(mod)}
            />
          )}

          {/* TAB 4: ASK GEMINI AI */}
          {activeTab === "chat" && (
            <div style={{ background: "rgba(18, 18, 28, 0.85)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "0.5rem" }}>
                <h3 style={{ color: "#fff", fontWeight: 700, margin: 0 }}>Ask Google Gemini About {analysisData.repository_name}</h3>
                {chatMessages.length > 0 && (
                  <button
                    onClick={() => {
                      setChatMessages([])
                      setChatInput("")
                    }}
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                  >
                    Clear Chat History
                  </button>
                )}
              </div>
              <p style={{ color: "#a1a1aa", fontSize: "0.875rem", marginBottom: "1rem" }}>Ask natural language questions like &quot;Where should I modify user auth?&quot; or &quot;Where are API routes defined?&quot;</p>
              
              {/* Modification Guide Quick Chips */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "1rem" }}>
                <button onClick={() => handleSendChat("Where should I modify user authentication?")} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#a5b4fc", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", cursor: "pointer" }}>🛠️ Modify Auth</button>
                <button onClick={() => handleSendChat("Where should I modify database models?")} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#a5b4fc", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", cursor: "pointer" }}>💾 Modify Models</button>
                <button onClick={() => handleSendChat("Where should I add a new API route?")} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#a5b4fc", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", cursor: "pointer" }}>🔌 Add API Route</button>
                <button onClick={() => handleSendChat("Where is the main entry point?")} style={{ background: "rgba(99,102,241,0.15)", border: "1px solid #6366f1", color: "#a5b4fc", padding: "6px 12px", borderRadius: "999px", fontSize: "0.75rem", cursor: "pointer" }}>⚡ Main Entry</button>
              </div>

              {/* Messages List */}
              <div style={{ minHeight: "220px", maxHeight: "420px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem", padding: "1rem", background: "rgba(10,10,15,0.6)", borderRadius: "12px" }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: "#71717a", textAlign: "center", marginTop: "2rem" }}>No messages yet. Select a guide or type a question below!</div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%", background: msg.role === "user" ? "#6366f1" : "rgba(30,30,48,0.9)", color: "#fff", padding: "10px 14px", borderRadius: "12px", fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
                      {msg.content}
                      {msg.files?.length > 0 && (
                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "0.75rem", color: "#a5b4fc" }}>
                          Relevant files: {msg.files.join(", ")}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isChatLoading && (
                  <div style={{ color: "#a5b4fc", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                    <Loader2 size={16} className="animate-spin" /> Gemini AI is analyzing codebase...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Ask 'Where should I modify X?' or any code question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  style={{ flex: 1, background: "rgba(30,30,48,0.8)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", padding: "10px 14px", color: "#fff", outline: "none" }}
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={isChatLoading || !chatInput.trim()}
                  style={{ background: "#6366f1", border: "none", borderRadius: "8px", padding: "10px 20px", color: "#fff", fontWeight: 600, cursor: "pointer" }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Module Inspector Drawer */}
          {selectedModule && (
            <div style={{ position: "fixed", top: 0, right: 0, width: "380px", height: "100vh", background: "rgba(18, 18, 28, 0.98)", borderLeft: "1px solid rgba(255,255,255,0.15)", zIndex: 9999, padding: "1.5rem", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>Module Details</h3>
                <button onClick={() => setSelectedModule(null)} style={{ background: "none", border: "none", color: "#a1a1aa", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ color: "#818cf8", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>{selectedModule.name}</div>
              <div style={{ color: "#a1a1aa", fontSize: "0.8rem", marginBottom: "1rem" }}>{selectedModule.file_path}</div>
              <div style={{ background: "rgba(30,30,48,0.6)", padding: "12px", borderRadius: "8px", fontSize: "0.8rem", color: "#d4d4d8", marginBottom: "1rem" }}>
                {selectedModule.summary || `Contains ${selectedModule.functions?.length || 0} functions and ${selectedModule.line_count || 0} lines of code.`}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Functions ({selectedModule.functions?.length || 0})</h4>
                {(selectedModule.functions || []).map((f: any, idx: number) => (
                  <div key={idx} style={{ color: "#10b981", fontFamily: "monospace", fontSize: "0.75rem", padding: "3px 0" }}>• {typeof f === 'string' ? f : f.name}</div>
                ))}
              </div>
              <div>
                <h4 style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Imports ({selectedModule.imports?.length || 0})</h4>
                {(selectedModule.imports || []).map((i: any, idx: number) => (
                  <div key={idx} style={{ color: "#a5b4fc", fontFamily: "monospace", fontSize: "0.75rem", padding: "3px 0" }}>• {typeof i === 'string' ? i : i.statement || i.module}</div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW 1: FIRST PAGE / LANDING PAGE (Initial view)
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="page-root">
      {/* ── 3D Background ────────────────────────────────────────── */}
      <div className="canvas-wrapper" aria-hidden="true">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true }}>
          <TorusShader />
        </Canvas>
      </div>
      <div className="canvas-overlay" />

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className={`nav ${scrolled ? "nav--scrolled" : ""}`} id="main-nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo" id="nav-logo">
            <div className="nav-logo-circle">
              <span>A</span>
            </div>
            <span>Archaeologist</span>
          </a>

          <div className="nav-links" id="nav-links-desktop">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
          </div>

          <div className="nav-actions">
            {authUser ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "4px 14px 4px 6px", borderRadius: "999px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <img src={authUser.avatar} alt={authUser.name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#f8fafc" }}>@{authUser.username}</span>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                </button>

                {isUserMenuOpen && (
                  <div style={{ position: "absolute", top: "120%", right: 0, width: "280px", background: "#0d0f17", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "16px", padding: "14px", zIndex: 99999, boxShadow: "0 10px 35px rgba(0,0,0,0.8)" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{authUser.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" }}>@{authUser.username} • {authUser.reposCount || authUser.repos?.length || 0} Repos</div>
                    
                    {/* Available Repositories List */}
                    <div style={{ margin: "10px 0 8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "10px" }}>
                      <div style={{ color: "#818cf8", fontSize: "0.6875rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                        📁 Your GitHub Repositories ({authUser.repos?.length || 0})
                      </div>
                      <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(authUser.repos && authUser.repos.length > 0) ? (
                          authUser.repos.map((r: any) => (
                            <button
                              key={r.id || r.name}
                              onClick={() => {
                                setIsUserMenuOpen(false)
                                handleAnalyze(r.html_url)
                              }}
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "6px 10px", textAlign: "left", cursor: "pointer", transition: "all 0.15s ease" }}
                            >
                              <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.78125rem", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.name}
                              </div>
                              <div style={{ color: "#94a3b8", fontSize: "0.6875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {r.description || r.language || "GitHub Repository"}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div style={{ color: "#64748b", fontSize: "0.75rem", fontStyle: "italic", padding: "4px 0" }}>No public repos fetched.</div>
                        )}
                      </div>
                    </div>

                    <button onClick={handleSignOut} style={{ width: "100%", marginTop: "6px", background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "7px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                style={{ background: "#24292e", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 18px", borderRadius: "10px", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}
              >
                <Github size={16} /> Sign in with GitHub
              </button>
            )}

            <a href="#hero" className="nav-cta-button" id="nav-get-started">
              Get Started <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="hero" id="hero">
        <div className="hero-content">
          <Reveal>
            <div className="hero-badge">
              <Sparkles size={14} />
              <span>AI-Powered Codebase Intelligence</span>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <h1 className="hero-title text-balance">
              Understand Any Codebase
              <br />
              <span className="text-gradient-brand">In Minutes, Not Days</span>
            </h1>
          </Reveal>

          <Reveal delay={300}>
            <p className="hero-subtitle text-balance">
              The AI Codebase Archaeologist analyzes unfamiliar repositories and generates architecture maps, dependency graphs, key modules, entry points — and tells you exactly where to make changes.
            </p>
          </Reveal>

          <Reveal delay={450}>
            <div className="hero-input-wrapper">
              <div className="hero-input-container">
                <Github className="hero-input-icon" size={20} />
                <input
                  type="text"
                  placeholder="Paste a GitHub repository URL..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="hero-input"
                  disabled={isAnalyzing}
                />
                <button
                  className="hero-input-button"
                  onClick={() => handleAnalyze()}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Search size={18} /> Analyze
                    </>
                  )}
                </button>
              </div>

              {/* Quick Select User Repositories Bar */}
              {authUser && authUser.repos && authUser.repos.length > 0 && (
                <div style={{ marginTop: "1rem", background: "rgba(13, 15, 24, 0.8)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "12px", padding: "10px 14px", backdropFilter: "blur(12px)" }}>
                  <div style={{ color: "#a5b4fc", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Github size={14} /> ⚡ Select One of @{authUser.username}&apos;s Repositories to Analyze:
                  </div>
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                    {authUser.repos.map((repo: any) => (
                      <button
                        key={repo.id || repo.name}
                        onClick={() => {
                          setInputValue(repo.html_url)
                          handleAnalyze(repo.html_url)
                        }}
                        disabled={isAnalyzing}
                        style={{
                          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))",
                          border: "1px solid rgba(99, 102, 241, 0.4)",
                          color: "#38bdf8",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.78125rem",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        📦 {repo.name} ({repo.language})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ color: "#ef4444", marginTop: "0.75rem", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <XCircle size={16} /> {error}
                </div>
              )}

              <div style={{ marginTop: "1rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <MousePointerClick size={16} /> Works with any public or private repository
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────── */}
      <section className="section" id="features">
        <div className="section-inner">
          <Reveal>
            <div className="section-header">
              <span className="section-tag">Core Features</span>
              <h2 className="section-title text-balance">
                Everything You Need to <span className="text-gradient">Master Unknown Code</span>
              </h2>
              <p className="section-subtitle text-balance">
                Stop jumping between files. Get instant clarity on how the entire system pieces together.
              </p>
            </div>
          </Reveal>

          <div className="features-grid">
            <InteractiveFeatureCard
              icon={Map}
              title="Architecture Map"
              description="Visualize the entire system architecture instantly. See how frontend, backend, and database interact."
              delay={0}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
            <InteractiveFeatureCard
              icon={Layers}
              title="Important Modules"
              description="Automatically highlight the core modules that drive the application logic so you know where to look first."
              delay={100}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
            <InteractiveFeatureCard
              icon={Network}
              title="Dependency Relationships"
              description="Map out internal and external dependencies to understand the blast radius of your code changes."
              delay={200}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
            <InteractiveFeatureCard
              icon={Compass}
              title="Entry Points"
              description="Identify exactly where execution starts, from API endpoints to core application rendering loops."
              delay={300}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
            <InteractiveFeatureCard
              icon={Cpu}
              title="Where to modify?"
              description="Ask natural questions like 'Where do I add a new payment method?' and get precise file paths."
              delay={400}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
            <InteractiveFeatureCard
              icon={Shield}
              title="Security & Patterns"
              description="Automatically scan for architectural anti-patterns and vulnerabilities as part of the analysis."
              delay={500}
              onClick={() => handleAnalyze("https://github.com/expressjs/express")}
            />
          </div>
        </div>
      </section>

      {/* ── Terminal/How it Works ────────────────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="section-inner">
          <Reveal>
            <div className="section-header">
              <span className="section-tag">Live Analysis</span>
              <h2 className="section-title text-balance">
                Instant Clarity, <span className="text-gradient">Zero Setup</span>
              </h2>
            </div>
          </Reveal>

          <Reveal delay={200} direction="scale">
            <div className="terminal-preview">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot terminal-dot--red" />
                  <div className="terminal-dot terminal-dot--yellow" />
                  <div className="terminal-dot terminal-dot--green" />
                </div>
              </div>
              <div className="terminal-body">
                <div className="terminal-line" style={{ animationDelay: "0s" }}>
                  <span className="terminal-prompt">$</span>
                  <span className="terminal-command">archaeologist analyze https://github.com/user/legacy-repo</span>
                </div>
                <div className="terminal-line" style={{ animationDelay: "0.5s" }}>
                  <span className="terminal-success">✓</span> <span className="terminal-output">Cloning repository...</span>
                </div>
                <div className="terminal-line" style={{ animationDelay: "1s" }}>
                  <span className="terminal-success">✓</span> <span className="terminal-output">Generating architecture map...</span>
                </div>
                <div className="terminal-line" style={{ animationDelay: "1.5s" }}>
                  <span className="terminal-success">✓</span> <span className="terminal-output">Mapping dependency relationships...</span>
                </div>
                <div className="terminal-line" style={{ animationDelay: "2s" }}>
                  <span className="terminal-success">✓</span> <span className="terminal-output">Locating entry points and key modules...</span>
                </div>
                <div className="terminal-line" style={{ animationDelay: "2.5s" }}>
                  <span className="terminal-prompt">✨</span> <span style={{ color: "#fff", fontWeight: "bold" }}>Analysis complete! View Dashboard →</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="section" id="cta">
        <div className="section-inner">
          <Reveal direction="scale">
            <div className="cta-content">
              <div className="cta-glow-orb" />
              <h2 className="cta-title text-balance">
                Stop Wasting Hours on <span className="text-gradient-brand">Code Discovery</span>
              </h2>
              <p className="section-subtitle text-balance" style={{ margin: "0 auto", position: "relative", zIndex: 1 }}>
                Paste your repository URL and let our AI generate the architecture map and dependency insights instantly.
              </p>
              <div className="cta-buttons">
                <a href="#hero" className="btn-primary">
                  <Zap size={18} /> Analyze a Repo Now
                </a>
                <a href="#" className="btn-secondary">
                  <BookOpen size={18} /> Read the Docs
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      {/* GitHub Authentication Login & Search Modal */}
      <GitHubAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setAuthUser(user)
          setChatMessages([])
          setChatInput("")
        }}
        onRepoSelect={(repoUrl) => {
          setInputValue(repoUrl)
          handleAnalyze(repoUrl)
        }}
      />
    </div>
  )
}
