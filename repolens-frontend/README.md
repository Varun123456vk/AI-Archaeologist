# RepoLens AI — AI Codebase Archaeologist

> Hackathon MVP · Local/LAN Demo · No Cloud Services Required

## Quick Start

### 1. Start the Backend (FastAPI)

```bash
cd repolens-backend
pip install -r requirements.txt
python main.py
```

The API server starts at **http://localhost:8000**. Health check: `GET /api/health`

### 2. Start the Frontend (React + Vite)

```bash
cd repolens-frontend
npm install
npm run dev
```

The dev server starts at **http://localhost:5173** (opens in browser automatically).

---

## Architecture Overview

```
Hackthon/
├── repolens-frontend/        # React + Vite frontend
│   ├── src/
│   │   ├── main.jsx          # Entry point
│   │   ├── App.jsx           # Router + global state
│   │   ├── index.css         # Design system
│   │   ├── services/
│   │   │   └── api.js        # REST API client
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx/css
│   │   │   └── DashboardPage.jsx/css
│   │   └── components/
│   │       ├── ArchitectureGraph.jsx/css  # React Flow graph
│   │       ├── CustomNode.jsx/css         # Graph node component
│   │       ├── ModuleExplorer.jsx/css     # Module list + search
│   │       ├── EntryPoints.jsx/css        # Entry point cards
│   │       ├── ChatPanel.jsx/css          # AI Q&A chat
│   │       └── ModuleDrawer.jsx/css       # Side drawer details
│   └── package.json
│
├── repolens-backend/         # FastAPI + Python AST backend
│   ├── main.py               # Complete API server
│   └── requirements.txt
│
└── Front End Design/         # Reference design (v0/shadcn)
```

## API Contract

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Analyze a GitHub repo URL |
| `GET` | `/api/repository/{id}` | Get analysis results |
| `GET` | `/api/repository/{id}/graph` | Get graph nodes/edges |
| `POST` | `/api/chat` | AI Q&A about the repo |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, React Flow, Lucide Icons, Framer Motion |
| Backend | Python, FastAPI, AST, GitPython |
| Graph | @xyflow/react (React Flow) |
| Styling | Vanilla CSS design system (dark theme) |
