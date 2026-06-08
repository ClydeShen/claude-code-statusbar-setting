#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const WARNING_THRESHOLD  = 35; // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
const STALE_SECONDS      = 60;
const DEBOUNCE_CALLS     = 5;

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 10000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try { run(JSON.parse(input)); } catch (e) { process.exit(0); }
});

function run(data) {
  const sessionId = data.session_id;
  if (!sessionId || /[/\\]|\.\./.test(sessionId)) return process.exit(0);

  const metricsPath = path.join(os.tmpdir(), `claude-ctx-${sessionId}.json`);
  if (!fs.existsSync(metricsPath)) return process.exit(0);

  let metrics;
  try { metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8')); }
  catch (e) { return process.exit(0); }

  const now = Math.floor(Date.now() / 1000);
  if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) return process.exit(0);

  const remaining = metrics.remaining_percentage;
  const usedPct   = metrics.used_pct;
  if (remaining > WARNING_THRESHOLD) return process.exit(0);

  checkAndWarn(sessionId, remaining, usedPct);
}

function checkAndWarn(sessionId, remaining, usedPct) {
  const warnPath = path.join(os.tmpdir(), `claude-ctx-${sessionId}-warned.json`);
  let warnData = { callsSinceWarn: 0, lastLevel: null };
  let firstWarn = true;

  if (fs.existsSync(warnPath)) {
    try { warnData = JSON.parse(fs.readFileSync(warnPath, 'utf8')); firstWarn = false; }
    catch (e) { /* reset to defaults */ }
  }

  warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;

  const isCritical    = remaining <= CRITICAL_THRESHOLD;
  const currentLevel  = isCritical ? 'critical' : 'warning';
  const severityJump  = currentLevel === 'critical' && warnData.lastLevel === 'warning';

  if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityJump) {
    fs.writeFileSync(warnPath, JSON.stringify(warnData));
    return process.exit(0);
  }

  warnData.callsSinceWarn = 0;
  warnData.lastLevel = currentLevel;
  fs.writeFileSync(warnPath, JSON.stringify(warnData));

  const message = isCritical
    ? `CONTEXT CRITICAL: Context usage at ${usedPct}% (remaining: ${remaining.toFixed(0)}%). Context is nearly exhausted. Inform the user immediately and recommend running /compact before continuing. Do not start new tasks.`
    : `CONTEXT WARNING: Context usage at ${usedPct}% (remaining: ${remaining.toFixed(0)}%). Avoid starting new complex tasks. Consider running /compact at a natural stopping point to continue with a fresh context window.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: message,
    },
  }));
}
