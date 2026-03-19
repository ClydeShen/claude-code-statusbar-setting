# Windows PowerShell Installer for Claude Code Status Bar

Write-Host "🚀 Installing Claude Code Status Bar..." -ForegroundColor Cyan
Write-Host ""

# Check if ~/.claude exists
$ClaudeDir = Join-Path $env:USERPROFILE ".claude"
if (!(Test-Path $ClaudeDir)) {
    Write-Host "❌ Claude Code not found. Please install Claude Code first." -ForegroundColor Red
    Write-Host "   npm install -g @anthropic-ai/claude-code" -ForegroundColor Yellow
    exit 1
}

# Create backup
$StatuslineScript = Join-Path $ClaudeDir "statusline-command.sh"
if (Test-Path $StatuslineScript) {
    Write-Host "📦 Backing up existing statusline..." -ForegroundColor Yellow
    Copy-Item $StatuslineScript "$StatuslineScript.backup"
    Write-Host "✓ Backup created: $StatuslineScript.backup" -ForegroundColor Green
}

# Copy script
Write-Host "📋 Copying statusline script..." -ForegroundColor Yellow
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Copy-Item "$ScriptDir\statusline-command.sh" $StatuslineScript
Write-Host "✓ Script installed" -ForegroundColor Green

# Update settings.json
Write-Host "⚙️  Updating settings.json..." -ForegroundColor Yellow
$SettingsFile = Join-Path $ClaudeDir "settings.json"

# Create settings.json if it doesn't exist
if (!(Test-Path $SettingsFile)) {
    @{} | ConvertTo-Json | Out-File -FilePath $SettingsFile -Encoding utf8
}

# Load settings
$Settings = Get-Content $SettingsFile -Raw | ConvertFrom-Json

# Add statusLine config if not exists
if ($Settings.statusLine) {
    Write-Host "⚠️  statusLine already configured in settings.json" -ForegroundColor Yellow
    Write-Host "   Current config: $($Settings.statusLine | ConvertTo-Json -Compress)" -ForegroundColor Gray
} else {
    $Settings.statusLine = @{
        type = "command"
        command = "bash ~/.claude/statusline-command.sh"
    }
    $Settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $SettingsFile -Encoding utf8
    Write-Host "✓ settings.json updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Claude Code"
Write-Host "   2. The status bar should appear at the bottom"
Write-Host ""
Write-Host "🔧 To customize: ~/.claude/statusline-command.sh" -ForegroundColor Gray
Write-Host "📚 Documentation: https://github.com/ClydeShen/claude-code-statusbar-setting" -ForegroundColor Gray
