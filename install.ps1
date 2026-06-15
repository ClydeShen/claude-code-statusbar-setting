# Windows PowerShell Installer for Claude Code Status Bar (Node.js)

Write-Host "🚀 Installing Claude Code Status Bar..." -ForegroundColor Cyan
Write-Host ""

# --- Preflight checks -------------------------------------------------------

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is required but not found." -ForegroundColor Red
    Write-Host "   Install via https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$ClaudeDir = Join-Path $env:USERPROFILE ".claude"
if (-not (Test-Path $ClaudeDir)) {
    Write-Host "❌ ~/.claude not found. Please install Claude Code first." -ForegroundColor Red
    exit 1
}

$ScriptDir = if ($MyInvocation.MyCommand.Path) {
    Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $null  # piped via `iwr | iex` — no local files, fetch from GitHub
}
$RepoRaw = "https://raw.githubusercontent.com/ClydeShen/claude-code-statusbar-setting/master"

# --- Back up old bash script if present -------------------------------------

$OldBash = Join-Path $ClaudeDir "statusline-command.sh"
if (Test-Path $OldBash) {
    Write-Host "📦 Backing up old statusline-command.sh..." -ForegroundColor Yellow
    Copy-Item $OldBash "$OldBash.backup" -Force
    Write-Host "✓ Backup: $OldBash.backup" -ForegroundColor Green
}

# --- Copy scripts -----------------------------------------------------------

# Install scripts: copy if local (clone), else download (piped). Re-running
# this is also the update path.
function Install-File($Name) {
    $dest = Join-Path $ClaudeDir $Name
    $local = if ($ScriptDir) { Join-Path $ScriptDir $Name } else { $null }
    if ($local -and (Test-Path $local)) {
        Copy-Item $local $dest -Force
    } else {
        Invoke-WebRequest -UseBasicParsing "$RepoRaw/$Name" -OutFile $dest
    }
    Write-Host "✓ $dest" -ForegroundColor Green
}

Write-Host "📋 Installing scripts..." -ForegroundColor Yellow
Install-File "statusline.js"
Install-File "context-monitor.js"

# --- Patch settings.json (via Node, identical logic to install.sh) ----------

$SettingsFile = Join-Path $ClaudeDir "settings.json"
if (-not (Test-Path $SettingsFile)) {
    [System.IO.File]::WriteAllText($SettingsFile, "{}")
}

Write-Host "⚙️  Updating settings.json..." -ForegroundColor Yellow

$Patch = @'
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
'@

$TmpPatch = Join-Path $env:TEMP "ccsb-patch-$PID.js"
[System.IO.File]::WriteAllText($TmpPatch, $Patch)
node $TmpPatch $SettingsFile
Remove-Item $TmpPatch -Force

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Claude Code"
Write-Host "   2. The status bar appears at the bottom with colour-coded context usage"
Write-Host "   3. You will see warnings in Claude's responses when context is low"
Write-Host ""
Write-Host "🔧 To customize: edit ~/.claude/statusline.js" -ForegroundColor Gray
Write-Host "📚 Docs: https://github.com/ClydeShen/claude-code-statusbar-setting" -ForegroundColor Gray
