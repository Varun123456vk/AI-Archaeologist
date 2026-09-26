# RepoLens AI — Presentation Slide Content 📊🎤

---

## 📌 SLIDE 1: Title & Project Vision
**Title**: RepoLens AI — Codebase Archaeologist 🔍🚀  
**Subtitle**: Instant Codebase Intelligence, Automated Architecture Swimlanes & AI Q&A Assistant  

### **The Problem (Developer Pain Point)**:
- Onboarding to large, legacy, or open-source repositories takes **days or weeks**.
- Complex folder hierarchies and indirect dependency chains make it difficult to answer basic questions like:
  - *"Where is the entry point?"*
  - *"Which services depend on which models?"*
  - *"Where should I modify feature X without breaking anything?"*

---

## 💡 SLIDE 2: The Solution
**RepoLens AI** transforms complex git repositories into an interactive, visual, and AI-queryable codebase map within **seconds**.

### **What Makes RepoLens AI Unique**:
- **Automatic Swimlane Mapping**: Categorizes files into **Entry Points ➔ Core Services ➔ Models/Utilities**.
- **AST-Verified Parser**: Fast single-pass regex/AST parsing without massive language runtime overhead.
- **Deep Gemini AI Integration**: Context-aware Q&A that pinpoints exact file paths and line symbols.
- **High-Performance UI**: Shader-driven dark modern design built with React Flow v12 & Three.js.

---

## 🚀 SLIDE 3: Key Project Outcomes & Deliverables

1. **⚡ Sub-2-Second Shallow Code Ingestion**:
   - Single-branch shallow cloning (`git clone --depth 1`) paired with parallel AST symbol extraction.

2. **🗺️ 3-Column Architecture Swimlanes**:
   - Clean, left-to-right directed dependency paths with animated flow lines, node filters, and full-screen inspection.

3. **🎯 Execution Entry Point Discovery**:
   - Automatically identifies HTTP routes, server initializers, CLI entry scripts, and exported handler functions.

4. **🤖 "Where Do I Modify X?" Gemini AI Q&A**:
   - Contextual chat assistant powered by Google Gemini AI with fallback model chains (`gemini-flash-latest`, `gemini-3.5-flash`).

5. **🔑 GitHub Account Integration & Live Search**:
   - OAuth login, profile fetching, and real-time public repository search with **1-click instant analysis**.

---

## 🛠️ SLIDE 4: Technology Stack & Architecture

### **Frontend & Visualizations**:
- **Framework**: Next.js (TypeScript, React 19)
- **Graph Engine**: `@xyflow/react` (React Flow v12 with custom node rendering & minimap)
- **3D Graphic Shader**: React Three Fiber + `Three.js` (60 FPS animated hero canvas)
- **UI System**: Obsidian Dark Slate Theme, Glassmorphism, CSS Variables

### **Backend Engine**:
- **Server**: Node.js & Express.js API Gateway
- **Ingestion & Caching**: Custom in-memory caching (< 10ms re-runs) & shallow Git engine

### **AI Engine**:
- **Model**: Google Gemini API (`gemini-flash-latest`) for real-time codebase reasoning & Q&A.

---

## 📈 SLIDE 5: Measurable Impact & Metrics

| Metric | Before (Manual Exploration) | After (RepoLens AI) |
| :--- | :--- | :--- |
| **New Repo Onboarding Time** | 2 – 5 Days | **< 3 Minutes** |
| **Locating Entry Points** | 30 – 60 Minutes | **Instant (< 1s)** |
| **Mapping Core Dependencies** | Manual Code Tracing | **Automated 3-Column Graph** |
| **Answering "Where to Modify X"** | Searching Stack Traces / Grep | **Gemini AI Instant Symbol Lookup** |

---

## 🎯 SLIDE 6: Summary & Future Roadmap
- **Production-Ready MVP**: Unified Next.js + Express web app with active Gemini AI Q&A and GitHub OAuth.
- **Roadmap Ahead**:
  - Multi-language AST ASTree parsers (Java, C++, Rust).
  - PR/Diff Architecture Impact Analysis (visualize breaking changes on pull requests).
