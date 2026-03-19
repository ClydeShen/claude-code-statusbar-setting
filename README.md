# Claude Code Status Bar Settings

Collection of status bar configurations and scripts for Claude Code.

## 📚 About

The status line is a customizable bar at the bottom of Claude Code that displays dynamic information like:
- Current model name
- Context window usage
- Git branch and status
- Session cost and duration
- And more!

## 📁 Files

- `statusline-command.sh` - Main status bar script
- `examples/` - Example configurations
- `templates/` - Reusable templates

## 🚀 Quick Start

### 1. Copy the script

```bash
cp statusline-command.sh ~/.claude/
chmod +x ~/.claude/statusline-command.sh
```

### 2. Configure Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash ~/.claude/statusline-command.sh"
  }
}
```

### 3. Reload Claude Code

Restart Claude Code or run:

```
/statusline refresh
```

## 📊 Features

Current status bar displays:

| Element | Description |
|---------|-------------|
| Model | Current Claude model (Opus/Sonnet/Haiku) |
| Directory | Current working directory |
| Git Branch | Current branch with clickable link |
| Context Bar | Progress bar showing context usage |
| Remaining | Remaining context percentage |

## 🛠️ Customization

Edit `statusline-command.sh` to customize:
- Colors
- Displayed fields
- Layout
- Icons

## 📝 Examples

See `examples/` directory for:
- Minimal status bar
- Git-focused status bar
- Cost tracking status bar
- Multi-line layouts

## 🔗 Resources

- [Official Docs](https://code.claude.com/docs/en/statusline)
- [Community Examples](https://github.com/topics/claude-code-statusline)

## 📄 License

MIT
