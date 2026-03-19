# Claude Code Status Bar Configuration

> 🚀 One-click setup for Claude Code status bar. Copy, paste, done!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
┌─────────────────────────────────────────────────────────────────┐
│  [Opus] 📁 my-project | 🌿 main | [████████░░] 80% | ⚡20%     │
└─────────────────────────────────────────────────────────────────┘
```

### Display Elements

| Element | Example | Description |
|---------|---------|-------------|
| **Model** | `[Opus]` | Current Claude model |
| **Directory** | `📁 my-project` | Current working directory |
| **Git Branch** | `🌿 main` | Git branch with link |
| **Context Bar** | `[████████░░] 80%` | Context usage progress |
| **Remaining** | `⚡20%` | Remaining context |

---

## 🎨 Customization

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

| Code | Color | Example |
|------|-------|---------|
| `38;5;0-15` | Basic colors | Black, Red, Green, Yellow, Blue, Magenta, Cyan, White |
| `38;5;16-231` | 216 colors | Full color spectrum |
| `38;5;232-255` | Grayscale | 24 gray shades |

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

## 📁 Files

```
.
├── README.md                    # This file
├── statusline-command.sh        # Main status bar script
├── install.sh                   # One-click installer
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
