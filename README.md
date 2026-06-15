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
| **Account**     | `you`              | Active `claude-swap` / `cswap` account, username only (opt-in) |

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
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master/install.ps1 | iex
```

Then restart Claude Code. The installer copies `statusline.js` and
`context-monitor.js` into `~/.claude/`, points `statusLine` at the script, and
registers a context-warning hook — any existing `statusline-command.sh` is backed up.

### Update

Already installed? **Re-run the same one-liner** — it overwrites the scripts with
the latest and leaves your `settings.json` and env toggles untouched:

```bash
curl -fsSL https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master/install.sh | bash
```

```powershell
iwr -useb https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master/install.ps1 | iex
```

If you installed from a clone instead, `git pull` then re-run `install.sh`. (And
if your `statusLine` points directly at a checkout of this repo, `git pull` alone
is the update.)

---

## Customize

Edit `~/.claude/statusline.js`, or set these optional env vars in the `env` block
of `~/.claude/settings.json`:

| Variable                      | Default               | Effect                                                                                       |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| `CLAUDE_STATUSLINE_MODEL`     | `1`                   | `1` = show the model segment `[Opus 4.8 - medium]`; `0` = hide it (effort hides with it).     |
| `CLAUDE_STATUSLINE_ASCII_BAR` | `1`                   | `1` = ASCII bar `[████░░] 80%`; `0` = compact emoji form `🟢 80%`.                            |
| `CLAUDE_STATUSLINE_GSD`       | `0`                   | `1` = add a GSD segment: in-progress todo task, or `.planning/STATE.md` state.               |
| `CLAUDE_STATUSLINE_ACCOUNT`   | `0`                   | `1` = show the active `claude-swap` / `cswap` account username. Needs claude-swap installed.  |
| `CLAUDE_SWAP_DIR`             | `~/.claude-swap-backup` | claude-swap state directory read for the account segment (override if yours differs).        |

### Looks — copy the `env` block you want

**1. Default** (no env needed):

```
[Opus - high] 📁 my-project | main | [████░░░░░░] 46% | ⚡62%
```

**2. Compact emoji bar** — `"env": { "CLAUDE_STATUSLINE_ASCII_BAR": "0" }`

```
[Opus - high] 📁 my-project | main | 🟢 46% | ⚡62%
```

Thresholds: 🟢 `<50%` · 🟡 `<65%` · 🟠 `<80%` · 💀 `≥80%`.

**3. GSD segment** — `"env": { "CLAUDE_STATUSLINE_GSD": "1" }`

```
[Opus - high] 📁 my-project | main | v0.2 Account switcher ▰▰▱▱▱ 33% · Phase 01-discuss executing | [████░░░░░░] 46% | ⚡62%
```

**4. Both** — `"env": { "CLAUDE_STATUSLINE_ASCII_BAR": "0", "CLAUDE_STATUSLINE_GSD": "1" }`

```
[Opus - high] 📁 my-project | main | v0.2 Account switcher ▰▰▱▱▱ 33% · Phase 01-discuss executing | 🟢 46% | ⚡62%
```

**5. With account** — `"env": { "CLAUDE_STATUSLINE_ACCOUNT": "1" }` (requires `claude-swap` / `cswap`):

```
[Opus - high] 📁 my-project | main | [████░░░░░░] 46% | ⚡62% you
```

The account sits in the same zone as the remaining indicator (`⚡62% you`).
Only the username (the part before `@`) is shown, never the full email.

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
