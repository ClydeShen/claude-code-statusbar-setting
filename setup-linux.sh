#!/bin/bash
# Linux Auto-Setup for Claude Code Status Bar
# Complete setup including dependencies and configuration

set -e

echo "🐧 Claude Code Status Bar - Linux Setup"
echo "========================================"
echo ""

# Check if running on Linux
if [[ "$(uname)" != "Linux" ]]; then
    echo "❌ This script is for Linux only"
    exit 1
fi

# Detect package manager
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt-get"
    PKG_INSTALL="sudo apt-get install -y"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_INSTALL="sudo dnf install -y"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_INSTALL="sudo yum install -y"
elif command -v pacman &> /dev/null; then
    PKG_MANAGER="pacman"
    PKG_INSTALL="sudo pacman -S --noconfirm"
else
    echo "❌ Unsupported package manager. Please install jq manually."
    exit 1
fi

# Step 1: Install jq
echo "📦 Installing jq..."
$PKG_INSTALL jq
echo "✓ jq installed"

# Step 2: Install Node.js (if Claude Code not found)
if ! command -v claude &> /dev/null; then
    echo "📦 Installing Node.js (for Claude Code)..."
    if [ "$PKG_MANAGER" = "apt-get" ]; then
        curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$PKG_MANAGER" = "dnf" ]; then
        sudo dnf install -y nodejs
    fi
    echo "✓ Node.js installed"
fi

# Step 3: Check Claude Code
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

# Step 4: Run status bar installer
echo ""
echo "🚀 Installing status bar..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/install.sh"

# Step 5: Verify
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
if [ "$PKG_MANAGER" = "apt-get" ]; then
    $PKG_INSTALL fonts-noto-color-emoji  # Debian/Ubuntu
elif [ "$PKG_MANAGER" = "dnf" ]; then
    $PKG_INSTALL google-noto-color-emoji-fonts  # Fedora/RHEL
elif [ "$PKG_MANAGER" = "pacman" ]; then
    $PKG_INSTALL noto-fonts-emoji  # Arch
fi
echo "✓ Emoji fonts installed"
