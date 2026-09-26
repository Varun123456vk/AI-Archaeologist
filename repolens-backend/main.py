"""
RepoLens AI — FastAPI Backend
AI Codebase Archaeologist: Analyzes Python repositories using AST.
Local/LAN demo — no cloud services required.
"""

import ast
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── App Setup ───

app = FastAPI(
    title="RepoLens AI",
    description="AI Codebase Archaeologist — Python repository analysis engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for analysis results (hackathon MVP)
analysis_store: dict = {}


# ─── Models ───

class AnalyzeRequest(BaseModel):
    repo_url: str = Field(..., description="GitHub repository URL or local path")


class ChatRequest(BaseModel):
    repository_id: str
    question: str


class ModuleInfo(BaseModel):
    id: str
    name: str
    file_path: str
    type: str = "Python Module"
    language: str = "Python"
    imports: list = []
    functions: list = []
    classes: list = []
    dependencies: list = []
    imported_by: list = []
    is_entry_point: bool = False
    line_count: int = 0
    summary: str = ""


class GraphNode(BaseModel):
    id: str
    label: str
    type: str = "file"
    position: Optional[dict] = None


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str = "imports"


class AnalysisResult(BaseModel):
    repository_id: str
    repository_name: str = ""
    repo_url: str = ""
    language: str = "python"
    total_files: int = 0
    python_files: int = 0
    total_functions: int = 0
    total_classes: int = 0
    parsing_errors: int = 0
    modules: list = []
    dependencies: list = []
    entry_points: list = []
    graph: dict = {"nodes": [], "edges": []}


# ─── Health ───

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}


# ─── Analyze Repository ───

@app.post("/api/analyze")
async def analyze_repository(request: AnalyzeRequest):
    repo_url = request.repo_url.strip()
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    repo_id = f"repo_{uuid.uuid4().hex[:8]}"
    temp_dir = None

    try:
        # Clone or use local path
        if repo_url.startswith("http") or repo_url.startswith("git@"):
            temp_dir = tempfile.mkdtemp(prefix="repolens_")
            clone_repo(repo_url, temp_dir)
            repo_path = temp_dir
        else:
            repo_path = repo_url
            if not os.path.isdir(repo_path):
                raise HTTPException(status_code=400, detail=f"Path not found: {repo_path}")

        # Run analysis
        result = run_analysis(repo_id, repo_url, repo_path)
        analysis_store[repo_id] = result
        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


# ─── Get Repository ───

@app.get("/api/repository/{repo_id}")
async def get_repository(repo_id: str):
    if repo_id not in analysis_store:
        raise HTTPException(status_code=404, detail="Repository not found.")
    return analysis_store[repo_id]


# ─── Get Graph ───

@app.get("/api/repository/{repo_id}/graph")
async def get_repository_graph(repo_id: str):
    if repo_id not in analysis_store:
        raise HTTPException(status_code=404, detail="Repository not found.")
    return analysis_store[repo_id]["graph"]


# ─── Chat ───

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if request.repository_id not in analysis_store:
        raise HTTPException(status_code=404, detail="Repository not found. Run analysis first.")

    data = analysis_store[request.repository_id]
    answer, files, symbols, limitations = answer_question(request.question, data)

    return {
        "answer": answer,
        "relevant_files": files,
        "supporting_symbols": symbols,
        "limitations": limitations,
    }


# ─── Core Analysis Engine ───

def clone_repo(url: str, dest: str):
    """Clone a git repository to dest directory."""
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", url, dest],
            check=True,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Clone timed out (120s limit).")
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone: {e.stderr.strip()}")


def run_analysis(repo_id: str, repo_url: str, repo_path: str) -> dict:
    """Analyze all Python files in the repository using AST."""
    repo_name = extract_repo_name(repo_url)
    py_files = find_python_files(repo_path)
    all_files = find_all_files(repo_path)

    modules = []
    errors = 0
    all_imports_map = {}  # file -> set of imports

    for py_file in py_files:
        rel_path = os.path.relpath(py_file, repo_path).replace("\\", "/")
        try:
            with open(py_file, "r", encoding="utf-8", errors="ignore") as f:
                source = f.read()
            module_info = analyze_python_file(rel_path, source)
            modules.append(module_info)
            all_imports_map[rel_path] = set(
                imp if isinstance(imp, str) else imp.get("module", "")
                for imp in module_info["imports"]
            )
        except Exception:
            errors += 1

    # Compute imported_by
    module_paths = {m["file_path"] for m in modules}
    module_names = {m["name"] for m in modules}
    for mod in modules:
        imported_by = []
        for other in modules:
            if other["file_path"] == mod["file_path"]:
                continue
            other_imports = all_imports_map.get(other["file_path"], set())
            if mod["name"] in other_imports or mod["file_path"] in other_imports:
                imported_by.append(other["file_path"])
        mod["imported_by"] = imported_by

    # Detect entry points
    entry_points = detect_entry_points(modules)
    for mod in modules:
        mod_id = mod["id"]
        if any(ep["id"] == mod_id for ep in entry_points):
            mod["is_entry_point"] = True

    # Build graph
    graph = build_graph(modules, entry_points)

    # Gather all external dependencies
    all_deps = set()
    for mod in modules:
        for imp in mod["imports"]:
            imp_name = imp if isinstance(imp, str) else imp.get("module", "")
            if imp_name and imp_name not in module_names and imp_name not in module_paths:
                all_deps.add(imp_name)

    total_functions = sum(len(m["functions"]) for m in modules)
    total_classes = sum(len(m["classes"]) for m in modules)

    return {
        "repository_id": repo_id,
        "repository_name": repo_name,
        "repo_url": repo_url,
        "language": "python",
        "total_files": len(all_files),
        "python_files": len(py_files),
        "total_functions": total_functions,
        "total_classes": total_classes,
        "parsing_errors": errors,
        "modules": modules,
        "dependencies": sorted(all_deps),
        "entry_points": entry_points,
        "graph": graph,
    }


def analyze_python_file(rel_path: str, source: str) -> dict:
    """Parse a single Python file with AST."""
    name = Path(rel_path).stem
    if "/" in rel_path:
        # Use dotted module path
        name = rel_path.replace("/", ".").replace("\\", ".").removesuffix(".py")

    tree = ast.parse(source, filename=rel_path)
    lines = source.count("\n") + 1

    imports = extract_imports(tree)
    functions = extract_functions(tree)
    classes = extract_classes(tree)

    # Generate summary
    summary = generate_module_summary(rel_path, imports, functions, classes)

    return {
        "id": rel_path,
        "name": name,
        "file_path": rel_path,
        "type": "Python Module",
        "language": "Python",
        "imports": imports,
        "functions": functions,
        "classes": classes,
        "dependencies": [],
        "imported_by": [],
        "is_entry_point": False,
        "line_count": lines,
        "summary": summary,
    }


def extract_imports(tree: ast.AST) -> list:
    """Extract all imports from an AST."""
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    "module": alias.name,
                    "name": alias.asname or alias.name,
                    "line": node.lineno,
                })
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                imports.append({
                    "module": module,
                    "name": alias.name,
                    "line": node.lineno,
                })
    return imports


def extract_functions(tree: ast.AST) -> list:
    """Extract top-level and class method functions."""
    functions = []
    for node in ast.iter_child_nodes(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            functions.append({
                "name": node.name,
                "line": node.lineno,
                "end_line": node.end_lineno,
                "args": [arg.arg for arg in node.args.args],
                "is_async": isinstance(node, ast.AsyncFunctionDef),
                "decorators": [get_decorator_name(d) for d in node.decorator_list],
            })
    return functions


def extract_classes(tree: ast.AST) -> list:
    """Extract class definitions."""
    classes = []
    for node in ast.iter_child_nodes(tree):
        if isinstance(node, ast.ClassDef):
            methods = []
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    methods.append({
                        "name": item.name,
                        "line": item.lineno,
                        "is_async": isinstance(item, ast.AsyncFunctionDef),
                    })

            bases = [get_base_name(b) for b in node.bases]
            classes.append({
                "name": node.name,
                "line": node.lineno,
                "end_line": node.end_lineno,
                "bases": bases,
                "methods": methods,
                "decorators": [get_decorator_name(d) for d in node.decorator_list],
            })
    return classes


def get_decorator_name(node):
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{get_decorator_name(node.value)}.{node.attr}"
    elif isinstance(node, ast.Call):
        return get_decorator_name(node.func)
    return "unknown"


def get_base_name(node):
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return f"{get_base_name(node.value)}.{node.attr}"
    return "object"


def detect_entry_points(modules: list) -> list:
    """Heuristically detect likely entry points."""
    entry_points = []

    for mod in modules:
        fp = mod["file_path"].lower()
        name = mod["name"].lower()
        reasons = []

        # Main entry patterns
        if fp.endswith("__main__.py") or name == "__main__":
            reasons.append("__main__.py module")
        if fp == "main.py" or name == "main":
            reasons.append("main.py — likely application entry")

        # Check for if __name__ == "__main__" (approximate via function names)
        has_main_guard = any("main" in (f["name"] or "").lower() for f in mod["functions"])

        # App/server patterns
        if "app" in fp or "server" in fp or "wsgi" in fp or "asgi" in fp:
            imports_str = " ".join(
                (imp["module"] if isinstance(imp, dict) else imp)
                for imp in mod["imports"]
            ).lower()
            if any(fw in imports_str for fw in ["fastapi", "flask", "django", "starlette", "uvicorn"]):
                reasons.append("Creates web application")

        # CLI patterns
        if "cli" in fp or "command" in fp:
            reasons.append("CLI / command handler")

        # manage.py (Django)
        if fp == "manage.py":
            reasons.append("Django management script")

        # setup.py
        if fp == "setup.py":
            reasons.append("Package setup script")

        if reasons:
            entry_type = "main"
            if any("web" in r or "application" in r for r in reasons):
                entry_type = "api"
            elif any("cli" in r.lower() or "command" in r.lower() for r in reasons):
                entry_type = "cli"
            elif "manage" in fp:
                entry_type = "api"

            entry_points.append({
                "id": mod["file_path"],
                "name": mod["name"],
                "file_path": mod["file_path"],
                "entry_type": entry_type,
                "reason": "; ".join(reasons),
                "description": reasons[0],
            })

    return entry_points


def build_graph(modules: list, entry_points: list) -> dict:
    """Build nodes and edges for the architecture graph."""
    entry_ids = {ep["id"] for ep in entry_points}
    module_ids = {m["file_path"] for m in modules}
    module_names = {m["name"]: m["file_path"] for m in modules}

    nodes = []
    for i, mod in enumerate(modules):
        fp = mod["file_path"]
        node_type = "file"
        if fp in entry_ids:
            node_type = "entry"
        elif "service" in fp.lower():
            node_type = "service"
        elif "model" in fp.lower():
            node_type = "model"
        elif "database" in fp.lower() or "db" in fp.lower():
            node_type = "database"
        elif "auth" in fp.lower():
            node_type = "auth"
        elif "config" in fp.lower() or "settings" in fp.lower():
            node_type = "config"
        else:
            node_type = "module"

        nodes.append({
            "id": fp,
            "label": mod["name"] if len(mod["name"]) < 30 else Path(fp).name,
            "type": node_type,
        })

    # Edges from imports between known modules
    edges = []
    for mod in modules:
        source = mod["file_path"]
        for imp in mod["imports"]:
            imp_module = imp["module"] if isinstance(imp, dict) else imp
            target = None
            if imp_module in module_ids:
                target = imp_module
            elif imp_module in module_names:
                target = module_names[imp_module]
            if target and target != source:
                edges.append({
                    "source": source,
                    "target": target,
                    "label": "imports",
                })

    # Deduplicate edges
    seen = set()
    unique_edges = []
    for e in edges:
        key = (e["source"], e["target"])
        if key not in seen:
            seen.add(key)
            unique_edges.append(e)

    return {"nodes": nodes, "edges": unique_edges}


def generate_module_summary(rel_path: str, imports: list, functions: list, classes: list) -> str:
    """Generate a short description of the module."""
    parts = []
    name = Path(rel_path).stem

    if classes:
        class_names = ", ".join(c["name"] for c in classes[:3])
        parts.append(f"Defines {len(classes)} class(es): {class_names}")
    if functions:
        fn_names = ", ".join(f["name"] for f in functions[:3])
        suffix = f" and {len(functions) - 3} more" if len(functions) > 3 else ""
        parts.append(f"Contains {len(functions)} function(s): {fn_names}{suffix}")
    if imports:
        ext_imports = [
            (imp["module"] if isinstance(imp, dict) else imp)
            for imp in imports
            if not (imp["module"] if isinstance(imp, dict) else imp).startswith(".")
        ][:4]
        if ext_imports:
            parts.append(f"Imports: {', '.join(ext_imports)}")

    return ". ".join(parts) if parts else f"Python module: {name}"


# ─── Q&A Engine (keyword-based for MVP) ───

def answer_question(question: str, data: dict) -> tuple:
    """Simple keyword-based Q&A grounded in analysis data."""
    q = question.lower()
    modules = data.get("modules", [])
    entry_points = data.get("entry_points", [])

    relevant_files = []
    symbols = []
    answer_parts = []

    # Entry point questions
    if any(kw in q for kw in ["entry point", "main", "start", "run"]):
        if entry_points:
            for ep in entry_points:
                answer_parts.append(
                    f"**{ep['name']}** (`{ep['file_path']}`): {ep.get('description', ep.get('reason', 'Detected entry point'))}"
                )
                relevant_files.append(ep["file_path"])
            answer = "Detected entry points:\n\n" + "\n\n".join(answer_parts)
        else:
            answer = "No entry points were detected by the analysis engine."
        return answer, relevant_files, symbols, "Entry point detection is heuristic-based."

    # Authentication questions
    if any(kw in q for kw in ["auth", "login", "authentication", "password", "token"]):
        auth_modules = [m for m in modules if "auth" in m["file_path"].lower() or "auth" in m["name"].lower()]
        if auth_modules:
            for m in auth_modules:
                relevant_files.append(m["file_path"])
                symbols.extend(f["name"] for f in m["functions"][:5])
            answer = f"Authentication-related code was found in {len(auth_modules)} module(s):\n\n"
            answer += "\n".join(f"- `{m['file_path']}`: {m['summary']}" for m in auth_modules)
        else:
            # Search for auth-related symbols
            for m in modules:
                auth_fns = [f for f in m["functions"] if "auth" in f["name"].lower() or "login" in f["name"].lower() or "token" in f["name"].lower()]
                if auth_fns:
                    relevant_files.append(m["file_path"])
                    symbols.extend(f["name"] for f in auth_fns)
            if relevant_files:
                answer = f"No dedicated auth module found, but auth-related functions exist in: {', '.join(relevant_files)}"
            else:
                answer = "No authentication-related code was found in this repository."
        return answer, relevant_files, symbols, "Based on filename and symbol name matching."

    # Database questions
    if any(kw in q for kw in ["database", "db", "sql", "query", "orm", "model"]):
        db_modules = [m for m in modules if any(kw in m["file_path"].lower() for kw in ["database", "db", "model", "orm", "sql"])]
        if db_modules:
            for m in db_modules:
                relevant_files.append(m["file_path"])
                symbols.extend(c["name"] for c in m["classes"][:5])
            answer = f"Database-related code found in {len(db_modules)} module(s):\n\n"
            answer += "\n".join(f"- `{m['file_path']}`: {m['summary']}" for m in db_modules)
        else:
            answer = "No database-related modules were identified."
        return answer, relevant_files, symbols, "Based on filename pattern matching."

    # Import/dependency questions
    if any(kw in q for kw in ["import", "depend", "use", "which module"]):
        # Find modules that match the queried term
        search_terms = re.findall(r'\b\w+\b', q)
        for term in search_terms:
            if len(term) < 3 or term in {"the", "which", "what", "how", "does", "import", "module", "file", "where"}:
                continue
            matching = [m for m in modules if term in m["file_path"].lower() or term in m["name"].lower()]
            for m in matching:
                relevant_files.append(m["file_path"])
                importers = m.get("imported_by", [])
                if importers:
                    answer_parts.append(f"`{m['file_path']}` is imported by: {', '.join(importers)}")
                    symbols.extend(importers[:5])

        if answer_parts:
            answer = "\n\n".join(answer_parts)
        else:
            answer = "I couldn't find specific import relationships for that query. Try asking about a specific module name."
        return answer, relevant_files, symbols, "Based on import graph analysis."

    # Route/endpoint questions
    if any(kw in q for kw in ["route", "endpoint", "api", "url", "path"]):
        route_modules = [m for m in modules if any(kw in m["file_path"].lower() for kw in ["route", "endpoint", "api", "view", "controller"])]
        if not route_modules:
            # Check for decorator patterns
            for m in modules:
                route_fns = [f for f in m["functions"] if any(d in ["get", "post", "put", "delete", "patch", "route", "api_route"] for d in f.get("decorators", []))]
                if route_fns:
                    route_modules.append(m)

        if route_modules:
            for m in route_modules:
                relevant_files.append(m["file_path"])
                symbols.extend(f["name"] for f in m["functions"][:5])
            answer = f"API/route handling found in {len(route_modules)} module(s):\n\n"
            answer += "\n".join(f"- `{m['file_path']}`: {m['summary']}" for m in route_modules)
        else:
            answer = "No route/endpoint modules were identified."
        return answer, relevant_files, symbols, "Based on filename and decorator analysis."

    # Relationship questions
    if any(kw in q for kw in ["relationship", "connect", "between", "relate"]):
        answer = "Module relationships based on import analysis:\n\n"
        for m in modules[:10]:
            if m["imported_by"]:
                answer += f"- `{m['file_path']}` is imported by: {', '.join(m['imported_by'][:5])}\n"
                relevant_files.append(m["file_path"])
        if not relevant_files:
            answer = "No strong inter-module relationships were detected."
        return answer, relevant_files, symbols, "Based on import graph analysis."

    # Generic — search by keywords
    search_terms = [w for w in re.findall(r'\b\w+\b', q) if len(w) >= 3 and w not in {"the", "what", "where", "how", "does", "this", "that", "which", "can", "are", "for"}]
    for term in search_terms:
        for m in modules:
            if term in m["file_path"].lower() or term in m["name"].lower():
                relevant_files.append(m["file_path"])
            for fn in m["functions"]:
                if term in fn["name"].lower():
                    symbols.append(f"{m['file_path']}:{fn['name']}")
                    relevant_files.append(m["file_path"])
            for cls in m["classes"]:
                if term in cls["name"].lower():
                    symbols.append(cls["name"])
                    relevant_files.append(m["file_path"])

    relevant_files = list(dict.fromkeys(relevant_files))[:10]
    symbols = list(dict.fromkeys(symbols))[:10]

    if relevant_files:
        answer = f"Found references in {len(relevant_files)} file(s) matching your query:\n\n"
        for f in relevant_files[:5]:
            mod = next((m for m in modules if m["file_path"] == f), None)
            if mod:
                answer += f"- `{f}`: {mod['summary']}\n"
            else:
                answer += f"- `{f}`\n"
    else:
        answer = (
            "I couldn't find specific information for that query in the analysis results. "
            "Try asking about entry points, imports, authentication, database access, or specific file names."
        )

    return answer, relevant_files, symbols, "Keyword-based search across analysis results."


# ─── Helpers ───

def find_python_files(repo_path: str) -> list:
    """Find all .py files, excluding common non-source directories."""
    exclude = {".git", "__pycache__", ".tox", ".mypy_cache", "node_modules", ".eggs", "venv", ".venv", "env", ".env"}
    py_files = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in exclude]
        for f in files:
            if f.endswith(".py"):
                py_files.append(os.path.join(root, f))
    return py_files


def find_all_files(repo_path: str) -> list:
    """Count all source files."""
    exclude = {".git", "__pycache__", "node_modules", ".tox", "venv", ".venv"}
    all_files = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d not in exclude]
        all_files.extend(files)
    return all_files


def extract_repo_name(url: str) -> str:
    """Extract owner/repo from a GitHub URL or local path."""
    url = url.rstrip("/").removesuffix(".git")
    if "github.com" in url:
        parts = url.split("github.com/")[-1].split("/")
        if len(parts) >= 2:
            return f"{parts[0]}/{parts[1]}"
    return Path(url).name


# ─── Run ───

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
