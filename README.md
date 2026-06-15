# Claude Code Status Bar

> A Node.js status line for Claude Code: model, reasoning effort, directory,
> git branch, and an accurate, colour-coded context-usage bar.
>
> **Cross-platform:** Windows · macOS · Linux · **No dependencies** (uses the Node.js bundled with Claude Code)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Preview

```
[Opus - high] 📁 my-project | main | [████░░░░░░] 46% | ⚡62%
```

| Segment         | Example            | What it shows                                              |
| --------------- | ------------------ | --------------------------------------------------------- |
| **Model**       | `[Opus]`           | Current model                                             |
| **Effort**      | `- high`           | Reasoning effort (`low`…`max`); auto-hidden if unsupported |
| **Directory**   | `📁 my-project`    | Working directory — a clickable link to the repo          |
| **Branch**      | `main`             | Current git branch                                        |
| **Context bar** | `[████░░░░░░] 46%` | Context used, colour-coded by level                       |
| **Remaining**   | `⚡62%`            | Context remaining                                         |

The directory is an [OSC 8 hyperlink](https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda)
to the repo's `origin`. Clickable (usually **Ctrl/Cmd+Click**) in Windows
Terminal, VS Code, iTerm2, WezTerm, Kitty, GNOME Terminal, and Konsole; it shows
as plain text in terminals without OSC 8 support (JetBrains, Warp, Terminal.app).

---

## Install

### Let Claude install it (recommended)

Paste this prompt into Claude Code — it clones, installs, and verifies for you:

```
Install the Claude Code status bar from
https://github.com/ClydeShen/claude-code-statusbar-setting

1. Clone the repo to a temp location.
2. Run install.sh (use install.ps1 on Windows).
3. The installer copies statusline.js + context-monitor.js into ~/.claude/,
   sets statusLine in settings.json, and registers a PostToolUse context-warning hook.
4. Confirm the statusline renders with a colour-coded context bar, then tell me
   to restart Claude Code.
```

### Or run the installer yourself

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/main/install.ps1 | iex
```

Then restart Claude Code. The installer copies `statusline.js` and
`context-monitor.js` into `~/.claude/`, points `statusLine` at the script, and
registers a context-warning hook — any existing `statusline-command.sh` is backed up.

---

## Customize

Edit `~/.claude/statusline.js`, or set these optional env vars in the `env` block
of `~/.claude/settings.json`:

| Variable                      | Default | Effect                                                                              |
| ----------------------------- | ------- | ----------------------------------------------------------------------------------- |
| `CLAUDE_STATUSLINE_ASCII_BAR` | on      | ASCII bar `[████░░] 80%`. Set falsy (`0`/`off`) for a compact emoji form `🟢 80%`.   |
| `CLAUDE_STATUSLINE_GSD`       | off     | Set truthy (`1`/`on`) to add a GSD segment: in-progress todo, or `.planning/STATE.md` state. |

### Looks — copy the `env` block you want

**1. Default** (no env needed):

```
[Opus - high] 📁 my-project | main | [████░░░░░░] 46% | ⚡62%
```

**2. Compact emoji bar** — `"env": { "CLAUDE_STATUSLINE_ASCII_BAR": "off" }`

```
[Opus - high] 📁 my-project | main | 🟢 46% | ⚡62%
```

Thresholds: 🟢 `<50%` · 🟡 `<65%` · 🟠 `<80%` · 💀 `≥80%`.

**3. GSD segment** — `"env": { "CLAUDE_STATUSLINE_GSD": "1" }`

```
[Opus - high] 📁 my-project | main | v0.2 Account switcher ▰▰▱▱▱ 33% · Phase 01-discuss executing | [████░░░░░░] 46% | ⚡62%
```

**4. Both** — `"env": { "CLAUDE_STATUSLINE_ASCII_BAR": "off", "CLAUDE_STATUSLINE_GSD": "1" }`

```
[Opus - high] 📁 my-project | main | v0.2 Account switcher ▰▰▱▱▱ 33% · Phase 01-discuss executing | 🟢 46% | ⚡62%
```

> The milestone bar uses 5-cell `▰▱` rectangles — deliberately different from the
> context bar's 10-cell `[█░]` blocks — so the two never get confused.

### Colours

Each segment's colour is a 256-palette code set near the top of `render()` in
`statusline.js`. Change the number in `\x1b[38;5;<N>m` ([colour chart](https://www.ditig.com/256-colors-cheat-sheet)).

| Segment            | Colour     | Code           |
| ------------------ | ---------- | -------------- |
| Model + brackets   | Blue       | `111`          |
| Effort             | Dark gray  | `240`          |
| Directory          | Orange     | `214`          |
| Branch             | Green      | `114`          |
| Remaining / `\|`   | Dark gray  | `240`          |
| Context bar        | Green → Yellow → Orange → Red by usage | `32` / `33` / `208` / `31` |

---

## Troubleshooting

- **Status bar not showing** — confirm the config: `cat ~/.claude/settings.json | jq .statusLine` should point at `node ~/.claude/statusline.js`. Restart Claude Code after install.
- **Shows `--%`** — context fields are empty until the first API response; it fills in after the first message.
- **Link not clickable / colours missing** — your terminal lacks OSC 8 or ANSI support; see the terminal list under [Preview](#preview).

Fonts (emoji + box-drawing glyphs): see [FONTS.md](FONTS.md).

---

## Resources

- [Claude Code status line docs](https://code.claude.com/docs/en/statusline)
- [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code)

## License

MIT — use and modify freely.
