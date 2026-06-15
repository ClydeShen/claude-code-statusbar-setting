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

// --- Optional GSD workflow segment ------------------------------------------
// Opt-in: only built when CLAUDE_STATUSLINE_GSD is truthy. Surfaces the current
// in-progress todo task, or the GSD milestone/phase state from .planning/STATE.md.
// Ported (self-contained) from the GSD-edition statusline so this file stays
// distributable — no machine-specific paths, silent-fail throughout.

function gsdEnabled() {
  const v = (process.env.CLAUDE_STATUSLINE_GSD || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'on' || v === 'yes';
}

/** Walk up from dir looking for .planning/STATE.md; return parsed state or null. */
function readGsdState(dir) {
  const home = os.homedir();
  let current = dir;
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(current, '.planning', 'STATE.md');
    if (fs.existsSync(candidate)) {
      try {
        return parseStateMd(fs.readFileSync(candidate, 'utf8'));
      } catch (e) {
        return null;
      }
    }
    const parent = path.dirname(current);
    if (parent === current || current === home) break;
    current = parent;
  }
  return null;
}

/** Parse STATE.md frontmatter + Phase line. Returns a partial state object. */
function parseStateMd(content) {
  const state = {};

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    for (const line of fm.split('\n')) {
      const m = line.match(/^(\w+):\s*(.+)/);
      if (!m) continue;
      const [, key, val] = m;
      const v = val.trim().replace(/^["']|["']$/g, '');
      if (key === 'status') state.status = v === 'null' ? null : v;
      if (key === 'milestone') state.milestone = v === 'null' ? null : v;
      if (key === 'milestone_name') state.milestoneName = v === 'null' ? null : v;
      if (key === 'active_phase') state.activePhase = (v === 'null' || v === '') ? null : v;
      if (key === 'next_action') state.nextAction = (v === 'null' || v === '') ? null : v;
    }
    const npFlowMatch = fm.match(/^next_phases:\s*\[([^\]]*)\]/m);
    if (npFlowMatch) {
      const items = npFlowMatch[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
      state.nextPhases = items.length > 0 ? items : null;
    } else {
      const npBlockMatch = fm.match(/^next_phases:\s*\n((?:[ \t]*-[ \t]*[^\n]+\n?)*)/m);
      if (npBlockMatch) {
        const items = npBlockMatch[1]
          .split('\n')
          .map(line => line.match(/^[ \t]*-[ \t]*(.+)$/))
          .filter(Boolean)
          .map(m => m[1].trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
        state.nextPhases = items.length > 0 ? items : null;
      }
    }
    const progMatch = fm.match(/^progress:\s*\n((?:[ \t]+\w+:.+\n?)+)/m);
    if (progMatch) {
      const cp = progMatch[1].match(/^[ \t]+completed_phases:\s*(\d+)/m);
      const tp = progMatch[1].match(/^[ \t]+total_phases:\s*(\d+)/m);
      const pc = progMatch[1].match(/^[ \t]+percent:\s*(\d+)/m);
      if (cp) state.completedPhases = cp[1];
      if (tp) state.totalPhases = tp[1];
      if (pc) state.percent = pc[1];
    }
  }

  const phaseMatch = content.match(/^Phase:\s*(\d+)\s+of\s+(\d+)(?:\s+\(([^)]+)\))?/m);
  if (phaseMatch) {
    state.phaseNum = phaseMatch[1];
    state.phaseTotal = phaseMatch[2];
    state.phaseName = phaseMatch[3] || null;
  }

  if (!state.status) {
    const bodyStatus = content.match(/^Status:\s*(.+)/m);
    if (bodyStatus) {
      const raw = bodyStatus[1].trim().toLowerCase();
      if (raw.includes('ready to plan') || raw.includes('planning')) state.status = 'planning';
      else if (raw.includes('execut')) state.status = 'executing';
      else if (raw.includes('complet') || raw.includes('archived')) state.status = 'complete';
    }
  }

  return state;
}

/**
 * Render a 5-segment milestone progress bar, or '' when percent is missing.
 * Uses ▰▱ rectangles (not the context bar's █░ blocks) and a shorter 5-cell
 * width so the milestone bar is visually distinct from the context-usage bar
 * when both are shown.
 */
function renderProgressBar(percent) {
  if (percent == null || isNaN(percent)) return '';
  const pct = Math.max(0, Math.min(100, parseInt(percent, 10)));
  const filled = Math.min(5, Math.round(pct / 20));
  const bar = '▰'.repeat(filled) + '▱'.repeat(5 - filled);
  return `${bar} ${pct}%`;
}

/** Format GSD state into a display string. */
function formatGsdState(s) {
  const parts = [];

  if (s.milestone || s.milestoneName) {
    const ver = s.milestone || '';
    const name = (s.milestoneName && s.milestoneName !== 'milestone') ? s.milestoneName : '';
    const bar = renderProgressBar(s.percent);
    const pieces = [ver, name, bar].filter(Boolean);
    if (pieces.length > 0) parts.push(pieces.join(' '));
  }

  const phasesStr = (s.nextPhases && s.nextPhases.length > 0) ? s.nextPhases.join('/') : null;

  if (s.activePhase) {
    const stage = s.status || '';
    parts.push(stage ? `Phase ${s.activePhase} ${stage}` : `Phase ${s.activePhase}`);
  } else if (s.nextAction && phasesStr) {
    parts.push(`next ${s.nextAction} ${phasesStr}`);
  } else if (Number(s.percent) === 100 || (s.completedPhases && s.totalPhases && s.completedPhases === s.totalPhases)) {
    parts.push('milestone complete');
  } else {
    if (s.status) parts.push(s.status);
    if (s.phaseNum && s.phaseTotal) {
      const phase = s.phaseName
        ? `${s.phaseName} (${s.phaseNum}/${s.phaseTotal})`
        : `ph ${s.phaseNum}/${s.phaseTotal}`;
      parts.push(phase);
    }
  }

  return parts.join(' · ');
}

/** Read the active session's in-progress todo task (activeForm), or ''. */
function readCurrentTask(session) {
  if (!session) return '';
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const todosDir = path.join(claudeDir, 'todos');
  if (!fs.existsSync(todosDir)) return '';
  try {
    const files = fs.readdirSync(todosDir)
      .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length === 0) return '';
    const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
    const inProgress = todos.find(t => t.status === 'in_progress');
    return inProgress ? (inProgress.activeForm || '') : '';
  } catch (e) {
    return '';
  }
}

/**
 * Build the opt-in GSD middle segment (with its own ANSI styling), or '' when
 * disabled or no data. Prefers the live todo task, falls back to GSD state.
 */
function buildGsdSegment(cwd, session) {
  if (!gsdEnabled()) return '';
  const task = readCurrentTask(session);
  if (task) return `\x1b[1m${task}\x1b[0m`; // bold — active work
  const gsdStateStr = formatGsdState(readGsdState(cwd) || {});
  if (gsdStateStr) return `\x1b[2m${gsdStateStr}\x1b[0m`; // dim — workflow state
  return '';
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
    return `\x1b[38;5;240m👤 ${name}\x1b[0m`;
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
  const gsdSeg = buildGsdSegment(cwd, session);

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

  let out = `${C_MODEL}[${modelInner}]${C_RESET} ${C_DIR}${dirLabel}${C_RESET}`;
  if (branch) out += `${SEP}${C_BRANCH}${branch}${C_RESET}`;
  if (gsdSeg) out += `${SEP}${gsdSeg}`;
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
