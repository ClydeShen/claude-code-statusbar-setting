#!/usr/bin/env bash
set -e

echo "🚀 Installing Claude Code Status Bar..."
echo ""

# --- Preflight checks -------------------------------------------------------

if ! command -v node &> /dev/null; then
  echo "❌ Node.js is required but not found."
  echo "   Install via: https://nodejs.org  or  brew install node"
  exit 1
fi

if [ ! -d ~/.claude ]; then
  echo "❌ ~/.claude not found. Please install Claude Code first."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- Back up old bash script if present ------------------------------------

if [ -f ~/.claude/statusline-command.sh ]; then
  echo "📦 Backing up old statusline-command.sh..."
  cp ~/.claude/statusline-command.sh ~/.claude/statusline-command.sh.backup
  echo "✓ Backup: ~/.claude/statusline-command.sh.backup"
fi

# --- Install scripts (copy if local, else download) -------------------------
# Works both from a clone (files alongside this script) and via
# `curl ... | bash` (only this script is piped, so fetch the rest from GitHub).
# Re-running this is also the update path.

REPO_RAW="https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master"

install_file() {
  local name="$1"
  if [ -f "$SCRIPT_DIR/$name" ]; then
    cp "$SCRIPT_DIR/$name" ~/.claude/"$name"
  else
    curl -fsSL "$REPO_RAW/$name" -o ~/.claude/"$name"
  fi
  echo "✓ ~/.claude/$name"
}

echo "📋 Installing scripts..."
install_file statusline.js
install_file context-monitor.js

# --- Patch settings.json ----------------------------------------------------

SETTINGS_FILE=~/.claude/settings.json

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "{}" > "$SETTINGS_FILE"
fi

echo "⚙️  Updating settings.json..."

node - "$SETTINGS_FILE" <<'EOF'
const fs   = require('fs');
const file = process.argv[2];

let cfg = {};
try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {}

cfg.statusLine = { type: 'command', command: 'node ~/.claude/statusline.js' };

cfg.hooks = cfg.hooks || {};
cfg.hooks.PostToolUse = cfg.hooks.PostToolUse || [];

const monitorCmd = 'node ~/.claude/context-monitor.js';
const alreadyRegistered = cfg.hooks.PostToolUse.some(entry =>
  (entry.hooks || []).some(h => h.command === monitorCmd)
);

if (!alreadyRegistered) {
  cfg.hooks.PostToolUse.push({
    matcher: '',
    hooks: [{ type: 'command', command: monitorCmd }],
  });
}

fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
console.log('✓ settings.json updated');
EOF

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. The status bar appears at the bottom with colour-coded context usage"
echo "   3. You will see warnings in Claude's responses when context is low"
echo ""
echo "🔧 To customize: edit ~/.claude/statusline.js"
echo "📚 Docs: https://github.com/ClydeShen/claude-code-statusbar-setting"
