# Node.js Statusline Redesign

**Date:** 2026-06-08  
**Status:** Approved

## Problem

The existing `statusline-command.sh` has two core issues:

1. **Inaccurate context display** — uses `used_percentage` directly without accounting for Claude Code's 16.5% autocompact buffer reserve. This makes context appear lower than reality (e.g. shows 60% used when effectively 72% of *usable* context is gone).
2. **No agent awareness** — the statusline only informs the user. The AI itself has no signal when context is running low, so it continues starting new complex tasks when it shouldn't.

Secondary issues: multiple `jq` subprocess calls per render (slow), no colour grading.

## Goal

Deliver an installer (`install.sh`) that sets up accurate, colour-coded context tracking on any user's machine, and makes the AI aware of context pressure via a PostToolUse hook.

## Deliverables

| File in repo | Installed to | Purpose |
|---|---|---|
| `statusline.js` | `~/.claude/statusline.js` | Statusline renderer |
| `context-monitor.js` | `~/.claude/context-monitor.js` | PostToolUse hook |
| `install.sh` | executed by user | Copies files, patches `settings.json` |

## `statusline.js`

### Context calculation (core fix)

```
rawRemaining = data.context_window.remaining_percentage
autoCompactWindow = parseInt(CLAUDE_CODE_AUTO_COMPACT_WINDOW || '0')
bufferPct = autoCompactWindow > 0
  ? (autoCompactWindow / totalTokens) * 100
  : 16.5
usableRemaining = max(0, (rawRemaining - bufferPct) / (100 - bufferPct) * 100)
used = round(100 - usableRemaining)
```

This matches `/context` command output and Claude Code's native reporting.

### Colour grading

| used | colour |
|---|---|
| < 50% | green |
| 50–64% | yellow |
| 65–79% | orange |
| ≥ 80% | red + blinking 💀 |

### Bridge file

Written to `/tmp/claude-ctx-{session_id}.json` after each render:

```json
{
  "session_id": "...",
  "remaining_percentage": 38.2,
  "used_pct": 62,
  "timestamp": 1234567890
}
```

`used_pct` uses the **raw** value (no buffer normalisation) to match Claude Code's own reporting in warning messages.

### Output format

Preserves existing visual style:

```
[claude-sonnet-4-6] 📁 my-project | main | [████████░░] 78% | ⚡22%
```

### Error handling

- 3-second stdin timeout (silent exit) to avoid hanging on pipe issues
- Silent fail on bridge file write errors
- Rejects session IDs containing `/`, `\`, or `..` before writing to `/tmp`

## `context-monitor.js`

PostToolUse hook. Reads bridge file and injects `additionalContext` when thresholds are crossed.

### Thresholds

| remaining | level | action |
|---|---|---|
| ≤ 35% | WARNING | suggest /compact at next stopping point |
| ≤ 25% | CRITICAL | instruct AI to inform user immediately |

### Warning messages

**WARNING:**
```
CONTEXT WARNING: Context usage at {used}% (remaining: {remaining}%).
Avoid starting new complex tasks. Consider running /compact at a natural
stopping point to continue with a fresh context window.
```

**CRITICAL:**
```
CONTEXT CRITICAL: Context usage at {used}% (remaining: {remaining}%).
Context is nearly exhausted. Inform the user immediately and recommend
running /compact before continuing. Do not start new tasks.
```

### Debounce

- Minimum 5 tool calls between warnings
- Severity escalation (WARNING → CRITICAL) bypasses debounce immediately
- Stale bridge file (> 60 seconds old) is ignored

### Output format

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "CONTEXT WARNING: ..."
  }
}
```

Silent exit (no output) when no warning is needed — does not block tool execution.

## `install.sh`

1. Check Node.js is available (`node --version`); exit with install instructions if not
2. Check `~/.claude/` exists; exit with Claude Code install instructions if not
3. Back up existing `~/.claude/statusline-command.sh` if present
4. Copy `statusline.js` and `context-monitor.js` to `~/.claude/`
5. Patch `~/.claude/settings.json` using Node.js (inline script) to set:
   - `statusLine.type = "command"`
   - `statusLine.command = "node ~/.claude/statusline.js"`
   - `hooks.PostToolUse[0]` = context-monitor hook entry
6. Print success summary and remind user to restart Claude Code

Uses Node.js (not `jq`) to patch `settings.json` — consistent with the rest of the toolchain and avoids an extra dependency.

## Out of scope

- Windows (`install.ps1`) — update separately after this lands
- GSD-specific STATE.md integration
- Fallback bash script
