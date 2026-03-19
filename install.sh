#!/bin/bash
# Claude Code Status Bar Installer
# One-click install for status bar configuration

set -e

echo "🚀 Installing Claude Code Status Bar..."
echo ""

# Check if ~/.claude exists
if [ ! -d ~/.claude ]; then
    echo "❌ Claude Code not found. Please install Claude Code first."
    exit 1
fi

# Create backup
if [ -f ~/.claude/statusline-command.sh ]; then
    echo "📦 Backing up existing statusline..."
    cp ~/.claude/statusline-command.sh ~/.claude/statusline-command.sh.backup
    echo "✓ Backup created: ~/.claude/statusline-command.sh.backup"
fi

# Copy script
echo "📋 Copying statusline script..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/statusline-command.sh" ~/.claude/statusline-command.sh
chmod +x ~/.claude/statusline-command.sh
echo "✓ Script installed"

# Update settings.json
echo "⚙️  Updating settings.json..."

SETTINGS_FILE=~/.claude/settings.json

# Create settings.json if it doesn't exist
if [ ! -f "$SETTINGS_FILE" ]; then
    echo "{}" > "$SETTINGS_FILE"
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ jq is required but not installed."
    echo "   Install with: brew install jq"
    exit 1
fi

# Add statusLine config if not exists
if ! jq -e '.statusLine' "$SETTINGS_FILE" > /dev/null 2>&1; then
    jq '.statusLine = {"type": "command", "command": "bash ~/.claude/statusline-command.sh"}' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"
    mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    echo "✓ settings.json updated"
else
    echo "⚠️  statusLine already configured in settings.json"
    echo "   Current config: $(jq -c '.statusLine' "$SETTINGS_FILE")"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. The status bar should appear at the bottom"
echo ""
echo "🔧 To customize, edit: ~/.claude/statusline-command.sh"
echo "📚 Documentation: https://github.com/ClydeShen/claude-code-statusbar-setting"
echo ""
