# Claude Code Status Bar Configuration

> 🚀 One-click setup for Claude Code status bar. Copy, paste, done!
>
> **Cross-platform:** Windows | macOS | Linux

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Setup with Claude Code

**Just ask Claude Code to set it up for you:**

### Option 1: Let Claude Do It

Copy and paste this prompt into Claude Code:

```
Please help me configure the Claude Code status bar using this repository:
https://github.com/ClydeShen/claude-code-statusbar-setting

1. Clone the repository
2. Run: bash install.sh
3. Restart Claude Code
4. Verify the statusline appears with colour-coded context usage

The installer requires Node.js (included with Claude Code) and sets up:
- A statusline showing model, directory, branch, and accurate context usage
- A PostToolUse hook that warns when context is running low
```

Claude will:

- ✅ Clone the repository
- ✅ Run the installer
- ✅ Update settings.json
- ✅ Verify it's working

---

### Option 2: One-Command Install

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.ps1 | iex
```

---

### Option 3: Manual Setup

```bash
# Clone and install
git clone https://github.com/ClydeShen/claude-code-statusbar-setting.git ~/.claude-statusbar
cd ~/.claude-statusbar
bash install.sh
# Requires Node.js. Claude Code bundles Node so no extra install needed.
```

---

## 🖥️ Platform-Specific Setup

### macOS

```bash
# 1. Install dependencies (if needed)
brew install jq

# 2. Run installer
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.sh | bash

# 3. Restart Claude Code
```

**Auto-configuration script:**

```bash
# Full auto-setup for macOS
./setup-macos.sh
```

### Linux

```bash
# 1. Install dependencies
sudo apt-get update && sudo apt-get install -y jq  # Debian/Ubuntu
# OR
sudo dnf install -y jq  # Fedora/RHEL

# 2. Run installer
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.sh | bash

# 3. Restart Claude Code
```

**Auto-configuration script:**

```bash
# Full auto-setup for Linux
./setup-linux.sh
```

### Windows

```powershell
# 1. Install jq (if not installed)
choco install jq  # Using Chocolatey
# OR
winget install jq  # Using winget

# 2. Run installer
iwr -useb https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.ps1 | iex

# 3. Restart Claude Code
```

**Auto-configuration script:**

```powershell
# Full auto-setup for Windows
.\setup-windows.ps1
```

---

## 🎯 Quick Start (30 seconds)

### Option 1: Automatic Install (Recommended)

```bash
# Clone and install
git clone https://github.com/ClydeShen/claude-code-statusbar-setting.git ~/.claude-statusbar
cd ~/.claude-statusbar
./install.sh

# Restart Claude Code
```

### Option 2: Manual Setup

**Step 1:** Copy the script

```bash
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/statusline-command.sh -o ~/.claude/statusline-command.sh
chmod +x ~/.claude/statusline-command.sh
```

**Step 2:** Add to settings

Edit `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

**Step 3:** Restart Claude Code

---

## 📊 Preview

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Opus - high] 📁 my-project | main | [████████░░] 80% | ⚡20%         │
└──────────────────────────────────────────────────────────────────────┘
```

### Display Elements

| Element            | Example            | Description                                                |
| ------------------ | ------------------ | --------------------------------------------------------- |
| **Model**          | `[Opus]`           | Current Claude model                                       |
| **Effort**         | `- high`           | Reasoning effort (`low`…`max`), inside the model bracket   |
| **Directory**      | `📁 my-project`    | Working directory; OSC 8 hyperlink to the repo `origin`    |
| **Git Branch**     | `main`             | Current git branch                                         |
| **Context Bar**    | `[████████░░] 80%` | Context usage progress (colour-coded)                      |
| **Remaining**      | `⚡20%`            | Remaining context                                          |

The **Effort** segment is shown in dark gray and only appears when the current
model exposes `effort.level` (e.g. Opus); it follows mid-session `/effort`
changes and is hidden for models that don't support the effort parameter.

The directory is wrapped in an [OSC 8 hyperlink](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda)
pointing at the repo's `origin` remote. It is clickable in terminals that
support OSC 8 (Windows Terminal, VS Code, iTerm2, WezTerm, Kitty, GNOME
Terminal, Konsole) — usually via **Ctrl+Click** (**Cmd+Click** on macOS). It
degrades to plain text in terminals without OSC 8 support (JetBrains terminal,
Warp, macOS Terminal.app, legacy Windows conhost).

---

## 🎨 Customization

### Environment Toggles

The Node.js statusline (`statusline.js`) reads two optional environment
variables. Set them in your shell profile or in the `env` block of
`~/.claude/settings.json`.

| Variable                    | Default       | Effect                                                                                       |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `CLAUDE_STATUSLINE_ASCII_BAR` | on (ASCII)  | ASCII progress bar (`[████░░] 80%`). Set to `0`/`false`/`off`/`no` for a compact `🟢 80%` form. |
| `CLAUDE_STATUSLINE_GSD`       | off         | Set to `1`/`true`/`on`/`yes` to add a GSD segment: the in-progress todo task, or milestone/phase state from `.planning/STATE.md`. |

Example `settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js"
  },
  "env": {
    "CLAUDE_STATUSLINE_ASCII_BAR": "off",
    "CLAUDE_STATUSLINE_GSD": "1"
  }
}
```

### Colors

Edit color codes in `statusline-command.sh`:

```bash
C_MODEL="\033[38;5;111m"    # Blue - model name
C_DIR="\033[38;5;214m"      # Orange - directory
C_BRANCH="\033[38;5;114m"   # Green - git branch
C_CTX="\033[38;5;244m"      # Gray - context bar
C_SESSION="\033[38;5;220m"  # Yellow - remaining
C_SEP="\033[38;5;240m"      # Dark gray - separator
```

### Available Colors

| Code           | Color        | Example                                               |
| -------------- | ------------ | ----------------------------------------------------- |
| `38;5;0-15`    | Basic colors | Black, Red, Green, Yellow, Blue, Magenta, Cyan, White |
| `38;5;16-231`  | 216 colors   | Full color spectrum                                   |
| `38;5;232-255` | Grayscale    | 24 gray shades                                        |

### Layout Options

**Minimal:**

```bash
[Opus] 80%
```

**Git-focused:**

```bash
[Opus] 📁 project | 🌿 main +2 ~5
```

**Full info:**

```bash
[Opus] 📁 project | 🌿 main | [████████░░] 80% | 💰 $0.15 | ⏱️ 25m
```

---

## ⚙️ Configuration Options

### Available Data Fields

All fields available from Claude Code:

```json
{
  "model": {
    "id": "claude-sonnet-4-20250514",
    "display_name": "Sonnet"
  },
  "cwd": "/path/to/project",
  "workspace": {
    "current_dir": "/path/to/project",
    "project_dir": "/path/to/project"
  },
  "cost": {
    "total_cost_usd": 0.15,
    "total_duration_ms": 150000,
    "total_lines_added": 100,
    "total_lines_removed": 50
  },
  "context_window": {
    "total_input_tokens": 150000,
    "total_output_tokens": 50000,
    "context_window_size": 200000,
    "used_percentage": 75,
    "remaining_percentage": 25,
    "current_usage": {
      "input_tokens": 10000,
      "output_tokens": 5000
    }
  },
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript",
  "version": "1.0.0"
}
```

### Extract Fields in Script

```bash
# Model
model=$(echo "$input" | jq -r '.model.display_name')

# Directory
dir=$(echo "$input" | jq -r '.cwd')

# Git branch
branch=$(git symbolic-ref --short HEAD 2>/dev/null)

# Context usage
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage')

# Cost
cost=$(echo "$input" | jq -r '.cost.total_cost_usd')

# Duration
duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms')
```

---

---

## 🔤 Font Configuration

The status bar uses emoji and special characters. Install required fonts:

**macOS:**

```bash
brew install --cask font-noto-color-emoji font-meslo-lg-nerd-font
```

**Linux:**

```bash
sudo apt-get install fonts-noto-color-emoji fonts-firacode  # Debian/Ubuntu
```

**Windows:**

```powershell
# Windows 10+ has built-in emoji support
```

📚 **Complete font guide:** [FONTS.md](FONTS.md)

## 📁 Files

```
.
├── README.md                    # This file
├── install.sh                   # One-click installer (macOS/Linux)
├── install.ps1                  # One-click installer (Windows)
├── setup-macos.sh               # Full auto-setup (macOS)
├── setup-linux.sh               # Full auto-setup (Linux)
├── setup-windows.ps1            # Full auto-setup (Windows)
├── statusline-command.sh        # Main status bar script
├── examples/
│   ├── minimal.sh              # Minimal display
│   ├── git-focused.sh          # Git-focused display
│   └── full-info.sh            # Full information display
└── templates/
    ├── basic.sh                # Basic template
    └── advanced.sh             # Advanced template
```

---

## 🔧 Troubleshooting

### Status bar not showing

1. Check script is executable:

   ```bash
   chmod +x ~/.claude/statusline-command.sh
   ```

2. Verify settings:

   ```bash
   cat ~/.claude/settings.json | jq '.statusLine'
   ```

3. Test script:
   ```bash
   echo '{"model":{"display_name":"Test"}}' | bash ~/.claude/statusline-command.sh
   ```

### Shows `--` instead of values

Fields may be null before first API response. Add fallbacks:

```bash
# Instead of:
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage')

# Use:
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
```

### Colors not working

Ensure your terminal supports ANSI colors. Test with:

```bash
echo -e "\033[31mRed\033[0m \033[32mGreen\033[0m \033[34mBlue\033[0m"
```

### jq not found

**macOS:**

```bash
brew install jq
```

**Linux:**

```bash
sudo apt-get install jq  # Debian/Ubuntu
sudo dnf install jq      # Fedora/RHEL
```

**Windows:**

```powershell
choco install jq  # Chocolatey
winget install jq # winget
```

---

## 🚀 Advanced Examples

### 1. Cost Tracking

```bash
#!/bin/bash
input=$(cat)
cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
printf "💰 $%.2f" "$cost"
```

### 2. Session Duration

```bash
#!/bin/bash
input=$(cat)
duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
mins=$((duration_ms / 60000))
secs=$(((duration_ms % 60000) / 1000))
printf "⏱️ %dm %ds" "$mins" "$secs"
```

### 3. Git Status

```bash
#!/bin/bash
input=$(cat)
dir=$(echo "$input" | jq -r '.cwd')
staged=$(git -C "$dir" diff --cached --numstat 2>/dev/null | wc -l | tr -d ' ')
modified=$(git -C "$dir" diff --numstat 2>/dev/null | wc -l | tr -d ' ')
printf "📝 +%s ~%s" "$staged" "$modified"
```

### 4. Multi-line Display

```bash
#!/bin/bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
dir=$(echo "$input" | jq -r '.cwd')
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')

echo "[$model] 📁 ${dir##*/}"
echo "[████████░░] ${used_pct}%"
```

---

## 📚 Resources

- [Official Claude Code Docs](https://code.claude.com/docs/en/statusline)
- [Community Examples](https://github.com/topics/claude-code-statusline)
- [ANSI Color Codes](https://en.wikipedia.org/wiki/ANSI_escape_code)

## 📄 License

MIT License - feel free to use and modify!
