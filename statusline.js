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
  const bufferPct = acw > 0 ? Math.min(100, (acw / totalCtx) * 100) : 16.5;

  const usableRemaining = Math.max(
    0,
    ((remaining - bufferPct) / (100 - bufferPct)) * 100,
  );
  const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
  return { used, remaining };
}

function writeBridge(session, remaining, used) {
  if (!session || /[/\\]|\.\./.test(session)) return;
  try {
    const p = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
    fs.writeFileSync(
      p,
      JSON.stringify({
        session_id: session,
        remaining_percentage: remaining,
        used_pct: Math.round(100 - remaining), // raw, no buffer normalisation
        timestamp: Math.floor(Date.now() / 1000),
      }),
    );
  } catch (e) {
    /* best-effort */
  }
}

// Context-bar style. Default ON = ASCII progress bar. Explicit falsy switches
// to a compact emoji + percentage form. `used` may be null (no context data).
function asciiBarEnabled() {
  const v = (process.env.CLAUDE_STATUSLINE_ASCII_BAR || '').toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

// Model segment (e.g. [Opus 4.8 - medium]). Default ON; set falsy to hide it
// — the effort lives inside the bracket, so it's hidden with the model.
function modelEnabled() {
  const v = (process.env.CLAUDE_STATUSLINE_MODEL || '').toLowerCase();
  return !(v === '0' || v === 'false' || v === 'off' || v === 'no');
}

function ctxEmoji(used) {
  if (used == null) return '⚪';
  if (used < 50) return '🟢';
  if (used < 65) return '🟡';
  if (used < 80) return '🟠';
  return '💀';
}

function buildCtxSegment(used) {
  if (!asciiBarEnabled()) {
    // Compact: emoji conveys severity (same thresholds as the bar) + percentage.
    return `${ctxEmoji(used)} ${used == null ? '--' : used}%`;
  }

  // ASCII progress bar (default).
  if (used == null) return `\x1b[38;5;244m[░░░░░░░░░░] --%\x1b[0m`;
  const filled = Math.floor(used / 10);
  const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

  if (used < 50) return `\x1b[32m[${bar}] ${used}%\x1b[0m`;
  if (used < 65) return `\x1b[33m[${bar}] ${used}%\x1b[0m`;
  if (used < 80) return `\x1b[38;5;208m[${bar}] ${used}%\x1b[0m`;
  return `\x1b[5;31m💀 [${bar}] ${used}%\x1b[0m`;
}

function gitRemoteUrl(cwd) {
  try {
    const { execFileSync } = require('child_process');
    const raw = execFileSync(
      'git',
      ['-C', cwd, 'remote', 'get-url', 'origin'],
      { stdio: ['pipe', 'pipe', 'ignore'] },
    )
      .toString()
      .trim();
    if (!raw) return '';
    // Convert SSH git@github.com:user/repo.git → https://github.com/user/repo
    const ssh = raw.match(/^git@([^:]+):(.+?)(\.git)?$/);
    if (ssh) return `https://${ssh[1]}/${ssh[2]}`;
    // Strip trailing .git from HTTPS URLs
    return raw.replace(/\.git$/, '');
  } catch (e) {
    return '';
  }
}

function gitBranch(cwd) {
  try {
    const { execFileSync } = require('child_process');
    // Use execFileSync with array args to avoid shell injection
    try {
      return execFileSync(
        'git',
        ['-C', cwd, 'symbolic-ref', '--short', 'HEAD'],
        { stdio: ['pipe', 'pipe', 'ignore'] },
      )
        .toString()
        .trim();
    } catch (e) {
      return execFileSync('git', ['-C', cwd, 'rev-parse', '--short', 'HEAD'], {
        stdio: ['pipe', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
    }
  } catch (e) {
    return '';
  }
}

// --- Optional account segment (claude-swap / cswap) -------------------------
// Opt-in: only built when CLAUDE_STATUSLINE_ACCOUNT is truthy. Shows the active
// account email from claude-swap's state file. Override the state directory with
// CLAUDE_SWAP_DIR. Silent-fail throughout (e.g. claude-swap not installed).
function accountEnabled() {
  const v = (process.env.CLAUDE_STATUSLINE_ACCOUNT || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'on' || v === 'yes';
}

function buildAccountSegment() {
  if (!accountEnabled()) return '';
  try {
    const dir =
      process.env.CLAUDE_SWAP_DIR ||
      path.join(os.homedir(), '.claude-swap-backup');
    const state = JSON.parse(
      fs.readFileSync(path.join(dir, 'sequence.json'), 'utf8'),
    );
    const acct = state.accounts?.[state.activeAccountNumber];
    const email = acct?.email;
    if (!email) return '';
    // Local part only — don't expose the full email/domain in the status bar.
    const name = email.split('@')[0];
    // Same dark gray as the remaining (⚡%) indicator — they share a zone.
    return `\x1b[38;5;240m${name}\x1b[0m`;
  } catch (e) {
    return '';
  }
}

function render(data) {
  const model = data.model?.display_name || '?';
  const cwd = data.workspace?.current_dir || data.cwd || process.cwd();
  const session = data.session_id || '';
  const dirname = path.basename(cwd);

  const ESC = '\x1b';
  const C_RESET = `${ESC}[0m`;
  const C_MODEL = `${ESC}[38;5;111m`;
  const C_DIR = `${ESC}[38;5;214m`;
  const C_BRANCH = `${ESC}[38;5;114m`;
  const C_CTX = `${ESC}[38;5;244m`;
  const C_EFFORT = `${ESC}[38;5;240m`; // dark gray — reasoning effort, inside the model bracket
  const C_SEP = `${ESC}[38;5;240m`;
  const SEP = `${C_SEP} | ${C_RESET}`;

  const ctx = computeUsed(data);
  if (ctx) writeBridge(session, ctx.remaining, ctx.used);

  const ctxSeg = buildCtxSegment(ctx ? ctx.used : null);

  const remainSeg = ctx ? `⚡${ctx.remaining.toFixed(0)}%` : '⚡--%';

  const branch = gitBranch(cwd);
  const repoUrl = gitRemoteUrl(cwd);

  // OSC 8 hyperlink: \e]8;;URL\e\\TEXT\e]8;;\e\\
  const dirLabel = repoUrl
    ? `\x1b]8;;${repoUrl}\x1b\\📁 ${dirname}\x1b]8;;\x1b\\`
    : `📁 ${dirname}`;

  // Effort lives inside the model bracket: [Opus - high]. Absent when the
  // model does not expose effort.level — then it's just [Opus].
  const effort = data.effort?.level;
  const modelInner = effort
    ? `${model} ${C_EFFORT}- ${effort}${C_MODEL}`
    : model;

  const acctSeg = buildAccountSegment();

  const modelLabel = modelEnabled()
    ? `${C_MODEL}[${modelInner}]${C_RESET} `
    : '';

  let out = `${modelLabel}${C_DIR}${dirLabel}${C_RESET}`;
  if (branch) out += `${SEP}${C_BRANCH}${branch}${C_RESET}`;
  // Remaining + account share the same right-hand zone (space-separated, no
  // divider): `⚡62% 👤 you`.
  let rightSeg = `${C_SEP}${remainSeg}${C_RESET}`;
  if (acctSeg) rightSeg += ` ${acctSeg}`;
  out += `${SEP}${ctxSeg}${SEP}${rightSeg}`;
  return out;
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);
    process.stdout.write(render(data));
  } catch (e) {
    // Silent fail — never break statusline on parse errors
  }
});
