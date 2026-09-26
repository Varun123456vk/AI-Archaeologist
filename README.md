# RepoLens AI — Codebase Archaeologist 🔍🚀

> **AI-Powered Codebase Intelligence, Architecture Mapping, Dependency Analysis, Entry Point Detection & Google Gemini Q&A Assistant**

RepoLens AI is an advanced, high-performance web application designed to help software engineers, open-source contributors, and development teams instantly understand any unfamiliar codebase in minutes instead of days.

---

## 🎯 Project Objectives

1. **Automate Codebase Onboarding**: Reduce developer onboarding time from days to under 3 minutes by automatically parsing any GitHub repository.
2. **Visualize Software Architecture**: Automatically construct 3-Column Swimlane dependency graphs (**Entry Points ➔ Services ➔ Models/Utilities**) for clear left-to-right code flow comprehension.
3. **Pinpoint Execution Entry Points**: Programmatically detect server initializers, HTTP API routes, CLI scripts, and exported handler functions via AST code analysis.
4. **Context-Aware AI Code Assistance**: Integrate Google Gemini AI to answer specific developer queries (*"Where should I modify feature X?"*) with exact file paths and function symbol targets.
5. **Streamline Developer Workflow**: Provide instant GitHub OAuth authentication, live account repository sync, and autocomplete search for 1-click codebase analysis.
6. **Ensure High Performance & Scale**: Deliver sub-2-second shallow cloning, in-memory caching (< 10ms re-runs), and a 60 FPS modern 3D visual UI interface.

---

## 🌟 Core Pillars & Key Features

1. **🗺️ 3-Column Architecture Map**
   - Renders a straight, 3-column swimlane dependency graph: **Entry Points ➔ Services ➔ Models & Utilities**.
   - Built with `@xyflow/react` (React Flow v12) featuring custom nodes, animated flow edges, live search filtering, minimap, and full-screen view.

2. **📦 Codebase Modules & Dependency Explorer**
   - Instant search and category filter pills (`All`, `⚡ Entry Points`, `🔗 High Dependency`, `🐍 Python`, `🟨 JS/TS`).
   - Displays line counts, function counts, import centrality metrics, and side-drawer detailed inspections.

3. **⚡ Execution Entry Points Identification**
   - AST-verified execution entry point detection (HTTP routes, CLI scripts, server initializers, `main`, `app`, `index` files).
   - Card layout displaying file paths, execution types, and key exported functions.

4. **🤖 Google Gemini AI Q&A Assistant ("Where Should I Modify X?")**
   - Natural language codebase Q&A powered by Google Gemini AI.
   - Answers questions like *"Where should I modify user auth?"* or *"Where are API routes defined?"*, referencing target file paths and key functions.
   - Includes quick-prompt chips and manual/automatic session chat history clearing.

5. **🔑 GitHub OAuth Login & Account Repository Fetcher**
   - Live GitHub REST API integration (`api.github.com`).
   - Fetch public/private repositories for logged-in accounts with 1-click analysis.
   - Live GitHub repository search autocomplete with **"Fetch Repo"** instant execution.

6. **🎨 State-of-the-Art Aesthetic UI / UX**
   - High-tech 3D Torus Shader Canvas built with React Three Fiber (`Three.js`).
   - Clean obsidian dark theme with complementary Cyan, Indigo, and Emerald accents.
   - 2-Page navigation flow: **Landing Page ➔ Dashboard View**.

---

## 🛠️ Technology Stack

### **Frontend (Unified Web App)**
- **Framework**: Next.js (App Router, Client Components)
- **Language**: TypeScript
- **Styling**: Vanilla CSS, Tailwind CSS tokens, Glassmorphism, CSS Variables
- **Graph Visualization**: `@xyflow/react` (React Flow v12)
- **3D Shader Canvas**: React Three Fiber (`@react-three/fiber`), `Three.js`
- **Icons**: Lucide React (`lucide-react`)

### **Backend Engine (`repolens-backend-node`)**
- **Runtime & Server**: Node.js, Express.js
- **Cloning Engine**: Shallow single-branch Git cloning (`git clone --depth 1 --single-branch --no-tags`)
- **Parser**: Parallel AST RegExp Code Parser (`Promise.all`)
- **Performance**: In-memory analysis store & URL cache (< 10ms re-runs)

### **AI Engine & External APIs**
- **AI Model**: Google Gemini API (`gemini-flash-latest`, with fallbacks to `gemini-3.5-flash` and `gemini-3.8-flash`)
- **GitHub Integration**: Official GitHub REST API (`https://api.github.com`) & GitHub OAuth Authorization

---

## 📡 API Reference

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "ok",
  "backend": "Node.js Express (High Performance)",
  "ai_engine": "Google Gemini 2.5 Flash API",
  "gemini_active": true,
  "timestamp": "2026-09-26T08:22:06.269Z"
}
```

### 2. Repository Analysis
- **Endpoint**: `POST /api/analyze`
- **Payload**: `{ "repo_url": "https://github.com/expressjs/express" }`
- **Response**: Returns total files, functions, classes, modules, entry points, graph nodes/edges, and Gemini `ai_summary`.

### 3. Gemini AI Codebase Q&A
- **Endpoint**: `POST /api/chat`
- **Payload**: `{ "repository_id": "repo_1234", "question": "Where should I modify request routing?" }`
- **Response**: Returns Gemini AI answer with relevant file paths and supporting function symbols.

---

## 🚀 How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- Git installed on host machine
- Google Gemini API Key (`GEMINI_API_KEY`)

### 1. Start Backend Server (`repolens-backend-node`)
```bash
cd repolens-backend-node
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

### 2. Start Web Frontend (`website`)
```bash
cd website
npm install --legacy-peer-deps
npm run dev
```
*Frontend runs on `http://localhost:3000`*

---

## 📄 License
Created for Hackathon Project Demo — All rights reserved.
