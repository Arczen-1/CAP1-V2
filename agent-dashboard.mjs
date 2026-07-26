#!/usr/bin/env node
// Live dashboard for the Capstone AI Agent Team.
// Reads the agents' real report files from agent-artifacts/ on every request and
// serves a self-refreshing page, so you can watch a run as it happens.
//
//   node agent-dashboard.mjs [artifactsDir] [--port 4599]
//
// Default artifactsDir = ./agent-artifacts (this checkout). Point it at a
// worktree's agent-artifacts/ to watch an in-progress isolated run.
// No external dependencies — pure Node (http + fs).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- args ----
const args = process.argv.slice(2);
let port = 4599;
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') { port = Number(args[++i]) || port; }
  else positional.push(args[i]);
}
const ARTIFACTS = path.resolve(positional[0] || path.join(__dirname, 'agent-artifacts'));
const HTML_FILE = path.join(__dirname, 'agent-dashboard.html');

// ---- report parsing ----
const REPORT_FILES = {
  request: 'request.md',
  thesisAlignment: 'thesis-alignment.md',
  researchReport: 'research-report.md',
  acceptanceCriteria: 'acceptance-criteria.md',
  implementationReport: 'implementation-report.md',
  testReport: 'test-report.md',
  gitDiff: 'git-diff-summary.md',
  panelDefense: 'panel-defense.md',
  finalStatus: 'final-status.md',
};
const STATUS_ORDER = ['ALIGNED WITH CONDITIONS', 'SCOPE CONFLICT', 'ALIGNED', 'BLOCKED'];
const VERDICT_ORDER = ['PASS WITH MINOR OBSERVATIONS', 'PASS', 'FAIL', 'BLOCKED'];
const FINAL_ORDER = ['COMPLETE', 'BLOCKED', 'CANCELLED', 'FAILED'];

const readIf = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const firstMatch = (text, options) => {
  if (!text) return null;
  const up = text.toUpperCase();
  let best = null, bestIdx = Infinity;
  for (const opt of options) {
    const idx = up.indexOf(opt);
    if (idx !== -1 && idx < bestIdx) { best = opt; bestIdx = idx; }
    else if (idx !== -1 && best && opt.startsWith(best) && idx <= bestIdx) { best = opt; bestIdx = idx; }
  }
  // Prefer the longest option that appears (so "PASS WITH MINOR OBSERVATIONS" beats "PASS")
  const present = options.filter((o) => up.includes(o));
  if (present.length) return present.sort((a, b) => b.length - a.length)[0];
  return best;
};

const extractTitle = (requestMd, fallback) => {
  if (!requestMd) return fallback;
  const t = requestMd.match(/##\s*Change Title\s*\n+([^\n#]+)/i);
  if (t && t[1].trim()) return t[1].trim();
  const h = requestMd.match(/^#\s+(.+)$/m);
  if (h && h[1].trim()) return h[1].trim();
  return fallback;
};

function scanChanges() {
  const dir = path.join(ARTIFACTS, 'changes');
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()); }
  catch { return []; }
  return entries.map((e) => {
    const cdir = path.join(dir, e.name);
    const raw = {};
    const present = {};
    for (const [key, fname] of Object.entries(REPORT_FILES)) {
      const content = readIf(path.join(cdir, fname));
      present[key] = content != null;
      if (content != null) raw[key] = content;
    }
    let mtime = 0;
    try { mtime = fs.statSync(cdir).mtimeMs; } catch {}
    const status = firstMatch(raw.thesisAlignment || raw.researchReport, STATUS_ORDER);
    const verdict = firstMatch(raw.testReport, VERDICT_ORDER);
    const finalStatus = firstMatch(raw.finalStatus, FINAL_ORDER);
    return {
      id: e.name,
      title: extractTitle(raw.request, e.name),
      mtime,
      present,
      status,
      verdict,
      finalStatus,
      reports: raw,
    };
  }).sort((a, b) => b.mtime - a.mtime);
}

function scanRuns() {
  const dir = path.join(ARTIFACTS, 'runs');
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.log')); } catch { return []; }
  return files.map((f) => {
    const p = path.join(dir, f);
    let st; try { st = fs.statSync(p); } catch { return null; }
    let tail = '';
    try {
      const buf = fs.readFileSync(p, 'utf8');
      tail = buf.length > 6000 ? buf.slice(-6000) : buf;
    } catch {}
    return { name: f, size: st.size, mtime: st.mtimeMs, tail };
  }).filter(Boolean).sort((a, b) => b.mtime - a.mtime);
}

function activity() {
  const nightly = readIf(path.join(ARTIFACTS, 'nightly-summary.md'));
  return {
    generatedAt: Date.now(),
    artifactsDir: ARTIFACTS,
    exists: fs.existsSync(ARTIFACTS),
    changes: scanChanges(),
    runs: scanRuns(),
    nightlySummary: nightly,
  };
}

// ---- server ----
const server = http.createServer((req, res) => {
  if (req.url === '/api/activity') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(activity()));
    return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    const html = readIf(HTML_FILE);
    if (html == null) { res.writeHead(500); res.end('agent-dashboard.html not found next to agent-dashboard.mjs'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(port, () => {
  console.log('');
  console.log('  Capstone Agent Team — LIVE dashboard');
  console.log('  Watching: ' + ARTIFACTS);
  console.log('  Open:     http://localhost:' + port + '/');
  console.log('');
  if (!fs.existsSync(ARTIFACTS)) {
    console.log('  (agent-artifacts/ not found yet — it will populate when a run starts.)');
  }
  console.log('  Leave this running; the page auto-refreshes every few seconds.');
  console.log('');
});
