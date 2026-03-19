#!/bin/bash
# macOS Auto-Setup for Claude Code Status Bar
# Complete setup including dependencies and configuration

set -e

echo "🍎 Claude Code Status Bar - macOS Setup"
echo "========================================"
echo ""

# Check if running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
    echo "❌ This script is for macOS only"
    exit 1
fi

# Step 1: Check Homebrew
echo "📦 Checking Homebrew..."
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew not found. Installing..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✓ Homebrew installed"
fi

# Step 2: Install jq
echo "📦 Installing jq..."
brew install jq
echo "✓ jq installed"

# Step 3: Install Node.js (if Claude Code not found)
if ! command -v claude &> /dev/null; then
    echo "📦 Installing Node.js (for Claude Code)..."
    brew install node
    echo "✓ Node.js installed"
fi

# Step 4: Check Claude Code
echo "🤖 Checking Claude Code..."
if ! command -v claude &> /dev/null; then
    echo "⚠️  Claude Code not found. Install with:"
    echo "   npm install -g @anthropic-ai/claude-code"
    echo ""
    echo "After installing Claude Code, run this script again."
    exit 1
else
    echo "✓ Claude Code installed"
fi

# Step 5: Run status bar installer
echo ""
echo "🚀 Installing status bar..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/install.sh"

# Step 6: Verify
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Restart Claude Code"
echo "   2. The status bar should appear at the bottom"
echo ""
echo "🔧 To customize: ~/.claude/statusline-command.sh"
echo "📚 Docs: https://github.com/ClydeShen/claude-code-statusbar-setting"

# Step 0: Install fonts for emoji support
echo "🔤 Checking fonts..."
if ! system_profiler SPFontsDataType | grep -q "Noto Color Emoji"; then
    echo "📦 Installing Noto Color Emoji font..."
    brew tap homebrew/cask-fonts
    brew install --cask font-noto-color-emoji
    echo "✓ Emoji font installed"
else
    echo "✓ Emoji font already installed"
fi
