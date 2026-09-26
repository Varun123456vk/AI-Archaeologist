import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const execFileAsync = promisify(execFile);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store & URL Cache for blazingly fast re-runs
const analysisStore = new Map();
const urlCache = new Map(); // cleanUrl -> result

// Helper: Call Google Gemini API with model fallback & robust handling
const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
  'gemini-2.5-pro',
];

async function callGeminiAPI(systemPrompt, userPrompt = '') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userPrompt ? `User Question: ${userPrompt}` : ''}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
          },
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return reply;
      } else {
        const errText = await response.text();
        console.warn(`Gemini API Warning (${model}):`, response.status, errText.slice(0, 150));
      }
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`Gemini model ${model} request failed:`, err.message);
    }
  }

  return null;
}

// Helper: Fast recursive file finder
async function findSourceFiles(dir, excludeDirs = new Set(['.git', 'node_modules', '__pycache__', 'dist', 'build', '.venv', 'venv', 'coverage', '.next'])) {
  let results = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (excludeDirs.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subResults = await findSourceFiles(fullPath, excludeDirs);
        results.push(...subResults);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.py', '.json', '.html', '.css', '.md'].includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Ignore unreadable dirs
  }
  return results;
}

// Fast file parsing
function analyzeFile(relativePath, content) {
  const lines = content.split(/\r?\n/);
  const lineCount = lines.length;

  const imports = [];
  const functions = [];
  const classes = [];

  const isPy = relativePath.endsWith('.py');
  const isJs = /\.[jt]sx?$/.test(relativePath);

  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (!trimmed) continue;

    if (isPy) {
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        imports.push({ line: idx + 1, statement: trimmed, module: trimmed.split(' ')[1] });
      } else if (trimmed.startsWith('def ')) {
        const fnMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)/);
        if (fnMatch) functions.push({ name: fnMatch[1], line: idx + 1 });
      } else if (trimmed.startsWith('class ')) {
        const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)/);
        if (classMatch) classes.push({ name: classMatch[1], line: idx + 1 });
      }
    } else if (isJs) {
      if (trimmed.startsWith('import ') || trimmed.includes('require(')) {
        imports.push({ line: idx + 1, statement: trimmed });
      }
      if (trimmed.includes('function') || trimmed.includes('=>')) {
        const fnMatch = trimmed.match(/(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)/);
        if (fnMatch) functions.push({ name: fnMatch[1] || fnMatch[2], line: idx + 1 });
      }
      if (trimmed.startsWith('class ')) {
        const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)/);
        if (classMatch) classes.push({ name: classMatch[1], line: idx + 1 });
      }
    }
  }

  const name = path.basename(relativePath);
  return {
    id: relativePath.replace(/[/\\]/g, '_'),
    name,
    file_path: relativePath,
    type: isPy ? 'Python Module' : isJs ? 'JavaScript Component/Module' : 'Source File',
    language: isPy ? 'Python' : isJs ? 'JavaScript/TypeScript' : 'Code',
    imports,
    functions,
    classes,
    dependencies: [],
    imported_by: [],
    is_entry_point: relativePath.includes('main') || relativePath.includes('index') || relativePath.includes('app') || relativePath.includes('server'),
    line_count: lineCount,
    summary: `Module contains ${functions.length} functions, ${classes.length} classes, and ${lineCount} lines of code.`,
  };
}

// Fast Graph Builder
function buildGraph(modules) {
  const nodes = [];
  const edges = [];

  const sampledModules = modules.slice(0, 100); // Limit visual graph to top 100 files for high FPS rendering

  sampledModules.forEach((mod, idx) => {
    const col = idx % 5;
    const row = Math.floor(idx / 5);

    nodes.push({
      id: mod.id,
      label: mod.name,
      type: mod.is_entry_point ? 'entry' : 'module',
      data: {
        label: mod.name,
        filePath: mod.file_path,
        type: mod.type,
        lineCount: mod.line_count,
        functionsCount: mod.functions.length,
      },
      position: { x: col * 260 + 50, y: row * 180 + 50 },
    });
  });

  const moduleMap = new Set(sampledModules.map(m => m.name.replace(/\.[^/.]+$/, '')));

  sampledModules.forEach((mod) => {
    mod.imports.forEach((imp) => {
      const impText = imp.statement || imp.module || '';
      for (const targetName of moduleMap) {
        if (targetName.length > 2 && impText.includes(targetName)) {
          const targetMod = sampledModules.find(m => m.name.startsWith(targetName));
          if (targetMod && targetMod.id !== mod.id) {
            edges.push({
              id: `e-${mod.id}-${targetMod.id}`,
              source: mod.id,
              target: targetMod.id,
              label: 'imports',
              animated: true,
            });
            break;
          }
        }
      }
    });
  });

  return { nodes, edges };
}

// ─── Endpoints ───

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  res.json({
    status: 'ok',
    backend: 'Node.js Express (High Performance)',
    ai_engine: hasGeminiKey ? 'Google Gemini 2.5 Flash API' : 'Static AST Code Parser (Add GEMINI_API_KEY for AI)',
    gemini_active: hasGeminiKey,
    timestamp: new Date().toISOString(),
  });
});

// Fast Analyze Repository
app.post('/api/analyze', async (req, res) => {
  const { repo_url } = req.body;
  if (!repo_url || typeof repo_url !== 'string') {
    return res.status(400).json({ detail: 'Repository URL or local path is required.' });
  }

  const cleanUrl = repo_url.trim();

  // Instant response from URL Cache if already analyzed
  if (urlCache.has(cleanUrl)) {
    console.log(`⚡ Instant cache hit for ${cleanUrl}`);
    return res.json(urlCache.get(cleanUrl));
  }

  const repoId = `repo_${crypto.randomBytes(4).toString('hex')}`;
  let targetPath = cleanUrl;
  let isTemp = false;

  try {
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('git@')) {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repolens_fast_'));
      targetPath = tempDir;
      isTemp = true;

      const startTime = Date.now();
      console.log(`⚡ Fast cloning ${cleanUrl}...`);

      // Ultra-fast shallow single-branch clone
      await execFileAsync('git', ['clone', '--depth', '1', '--single-branch', '--no-tags', cleanUrl, tempDir], { timeout: 60000 });
      console.log(`⚡ Cloned in ${Date.now() - startTime}ms`);
    }

    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ detail: `Provided path is not a directory: ${targetPath}` });
    }

    const files = await findSourceFiles(targetPath);

    // Parallel file read & parse with Promise.all
    const filePromises = files.slice(0, 300).map(async (filePath) => {
      try {
        const relPath = path.relative(targetPath, filePath).replace(/\\/g, '/');
        const content = await fs.readFile(filePath, 'utf-8');
        return analyzeFile(relPath, content);
      } catch (e) {
        return null;
      }
    });

    const parsedModules = (await Promise.all(filePromises)).filter(Boolean);
    const graph = buildGraph(parsedModules);

    const totalFunctions = parsedModules.reduce((acc, m) => acc + m.functions.length, 0);
    const totalClasses = parsedModules.reduce((acc, m) => acc + m.classes.length, 0);

    // Call Gemini AI to generate high-level architectural insights for scanned codebase
    let aiSummary = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      const topModuleNames = parsedModules.slice(0, 15).map(m => m.file_path).join(', ');
      const entryNames = parsedModules.filter(m => m.is_entry_point).map(m => m.file_path).join(', ');
      
      const systemPrompt = `You are RepoLens AI, an expert AI Codebase Archaeologist. Provide a concise 3-4 sentence architectural analysis for this codebase, detailing its main technology stack, architectural pattern, entry points, and module organization.`;
      const userPrompt = `Repository: ${path.basename(cleanUrl)}\nTotal Files: ${files.length}\nTotal Functions: ${totalFunctions}\nEntry Points: ${entryNames || 'N/A'}\nKey Files: ${topModuleNames}`;

      aiSummary = await callGeminiAPI(systemPrompt, userPrompt);
    }

    const result = {
      repository_id: repoId,
      repository_name: path.basename(cleanUrl).replace(/\.git$/, ''),
      repo_url: cleanUrl,
      language: parsedModules.some(m => m.language.includes('Python')) ? 'Python / JS' : 'JavaScript / Node.js',
      total_files: files.length,
      python_files: parsedModules.filter(m => m.type.includes('Python')).length,
      total_functions: totalFunctions,
      total_classes: totalClasses,
      parsing_errors: 0,
      ai_summary: aiSummary || `Scanned ${files.length} codebase files containing ${totalFunctions} functions. Entry points identified at ${parsedModules.filter(m => m.is_entry_point).map(m => m.name).join(', ') || 'root'}.`,
      gemini_active: !!aiSummary,
      modules: parsedModules,
      dependencies: Array.from(new Set(parsedModules.flatMap(m => m.imports.map(i => i.module || i.statement)).filter(Boolean))).slice(0, 30),
      entry_points: parsedModules.filter(m => m.is_entry_point),
      graph,
    };

    analysisStore.set(repoId, result);
    urlCache.set(cleanUrl, result);

    if (isTemp) {
      fs.rm(targetPath, { recursive: true, force: true }).catch(() => {});
    }

    res.json(result);
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ detail: `Analysis failed: ${err.message}` });
  }
});

// Get Repository Details
app.get('/api/repository/:repo_id', (req, res) => {
  const result = analysisStore.get(req.params.repo_id);
  if (!result) return res.status(404).json({ detail: 'Repository analysis not found.' });
  res.json(result);
});

// Get Graph Data
app.get('/api/repository/:repo_id/graph', (req, res) => {
  const result = analysisStore.get(req.params.repo_id);
  if (!result) return res.status(404).json({ detail: 'Repository analysis not found.' });
  res.json(result.graph);
});

// Chat Assistant with Ultra-fast Gemini Integration
app.post('/api/chat', async (req, res) => {
  const { repository_id, question } = req.body;
  const data = analysisStore.get(repository_id);

  if (!data) {
    return res.status(404).json({ detail: 'Repository not found. Run analysis first.' });
  }

  const q = (question || '').toLowerCase();
  const matchedModules = data.modules.filter(m => 
    m.name.toLowerCase().includes(q) || 
    m.file_path.toLowerCase().includes(q) ||
    m.functions.some(f => f.name.toLowerCase().includes(q))
  );

  const relevantFiles = matchedModules.slice(0, 5).map(m => m.file_path);
  const supportingSymbols = matchedModules.flatMap(m => m.functions.map(f => f.name)).slice(0, 8);

  const systemPrompt = `You are RepoLens AI, a concise & fast codebase assistant.
Repo: ${data.repository_name} | Files: ${data.total_files} | Funcs: ${data.total_functions}
Entry points: ${data.entry_points.map(e => e.file_path).join(', ')}
Matching files: ${relevantFiles.join(', ') || 'N/A'}`;

  const aiAnswer = await callGeminiAPI(systemPrompt, question);

  const answer = aiAnswer || (matchedModules.length > 0
    ? `Found ${matchedModules.length} relevant files for your query "${question}". Key components include ${matchedModules.map(m => m.name).join(', ')}.`
    : `The codebase analysis reveals ${data.total_files} files with ${data.total_functions} functions across entry points (${data.entry_points.map(e => e.name).join(', ') || 'N/A'}).`);

  res.json({
    answer,
    relevant_files: relevantFiles.length ? relevantFiles : data.modules.slice(0, 3).map(m => m.file_path),
    supporting_symbols: supportingSymbols,
    limitations: [],
  });
});

app.listen(PORT, () => {
  console.log(`⚡ Ultra-fast Node.js Express Backend running on http://localhost:${PORT}`);
});
