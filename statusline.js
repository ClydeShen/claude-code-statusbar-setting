#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function computeUsed(data) {
  const remaining = data.context_window?.remaining_percentage;
  if (remaining == null) return null;

  const totalCtx = data.context_window?.total_tokens || 1_000_000;
  const acw = parseInt(process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW || '0', 10);
  const bufferPct = acw > 0
    ? Math.min(100, (acw / totalCtx) * 100)
    : 16.5;

  const usableRemaining = Math.max(0, ((remaining - bufferPct) / (100 - bufferPct)) * 100);
  const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
  return { used, remaining };
}

function writeBridge(session, remaining, used) {
  if (!session || /[/\\]|\.\./.test(session)) return;
  try {
    const p = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
    fs.writeFileSync(p, JSON.stringify({
      session_id: session,
      remaining_percentage: remaining,
      used_pct: Math.round(100 - remaining), // raw, no buffer normalisation
      timestamp: Math.floor(Date.now() / 1000),
    }));
  } catch (e) { /* best-effort */ }
}

function buildCtxSegment(used) {
  const filled = Math.floor(used / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

  if (used < 50)  return `\x1b[32m[${bar}] ${used}%\x1b[0m`;
  if (used < 65)  return `\x1b[33m[${bar}] ${used}%\x1b[0m`;
  if (used < 80)  return `\x1b[38;5;208m[${bar}] ${used}%\x1b[0m`;
  return `\x1b[5;31m💀 [${bar}] ${used}%\x1b[0m`;
}

function gitBranch(cwd) {
  try {
    const { execFileSync } = require('child_process');
    // Use execFileSync with array args to avoid shell injection
    try {
      return execFileSync('git', ['-C', cwd, 'symbolic-ref', '--short', 'HEAD'],
        { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    } catch (e) {
      return execFileSync('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD'],
        { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    }
  } catch (e) { return ''; }
}

function render(data) {
  const model   = data.model?.display_name || '?';
  const cwd     = data.workspace?.current_dir || data.cwd || process.cwd();
  const session = data.session_id || '';
  const dirname = path.basename(cwd);

  const ESC = '\x1b';
  const C_RESET  = `${ESC}[0m`;
  const C_MODEL  = `${ESC}[38;5;111m`;
  const C_DIR    = `${ESC}[38;5;214m`;
  const C_BRANCH = `${ESC}[38;5;114m`;
  const C_CTX    = `${ESC}[38;5;244m`;
  const C_SEP    = `${ESC}[38;5;240m`;
  const SEP      = `${C_SEP} | ${C_RESET}`;

  const ctx = computeUsed(data);
  if (ctx) writeBridge(session, ctx.remaining, ctx.used);

  const ctxSeg = ctx
    ? buildCtxSegment(ctx.used)
    : `${C_CTX}[░░░░░░░░░░] --%${C_RESET}`;

  const remainSeg = ctx ? `⚡${ctx.remaining.toFixed(0)}%` : '⚡--%';

  const branch = gitBranch(cwd);

  let out = `${C_MODEL}[${model}]${C_RESET} ${C_DIR}📁 ${dirname}${C_RESET}`;
  if (branch) out += `${SEP}${C_BRANCH}${branch}${C_RESET}`;
  out += `${SEP}${ctxSeg}${SEP}${C_SEP}${remainSeg}${C_RESET}`;
  return out;
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    process.stdout.write(render(data));
  } catch (e) {
    // Silent fail — never break statusline on parse errors
  }
});
