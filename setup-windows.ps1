# Windows Auto-Setup for Claude Code Status Bar
# Complete setup including dependencies and configuration

Write-Host "🪟 Claude Code Status Bar - Windows Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check PowerShell version
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Host "❌ PowerShell 5.0 or higher required" -ForegroundColor Red
    exit 1
}

# Step 2: Install jq (if not found)
Write-Host "📦 Checking jq..." -ForegroundColor Yellow
if (!(Get-Command jq -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  jq not found. Installing..." -ForegroundColor Yellow
    
    # Try winget first
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id JM.Martineau.jq --silent
    }
    # Try chocolatey
    elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install jq -y
    }
    else {
        Write-Host "❌ Please install winget or chocolatey first" -ForegroundColor Red
        Write-Host "   winget: https://aka.ms/winget-cli"
        Write-Host "   chocolatey: https://chocolatey.org/install"
        exit 1
    }
    Write-Host "✓ jq installed" -ForegroundColor Green
} else {
    Write-Host "✓ jq already installed" -ForegroundColor Green
}

# Step 3: Check Node.js (if Claude Code not found)
if (!(Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "⚠️  Node.js not found. Installing..." -ForegroundColor Yellow
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install --id OpenJS.NodeJS.LTS --silent
        }
        elseif (Get-Command choco -ErrorAction SilentlyContinue) {
            choco install nodejs-lts -y
        }
        Write-Host "✓ Node.js installed" -ForegroundColor Green
        Write-Host "⚠️  Please restart PowerShell and run this script again" -ForegroundColor Yellow
        exit 0
    }
}

# Step 4: Check Claude Code
Write-Host "🤖 Checking Claude Code..." -ForegroundColor Yellow
if (!(Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Claude Code not found. Install with:" -ForegroundColor Yellow
    Write-Host "   npm install -g @anthropic-ai/claude-code" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installing Claude Code, run this script again." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Claude Code installed" -ForegroundColor Green
}

# Step 5: Run installer
Write-Host ""
Write-Host "🚀 Installing status bar..." -ForegroundColor Cyan
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$ScriptDir\install.ps1"

# Step 6: Verify
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Restart Claude Code"
Write-Host "   2. The status bar should appear at the bottom"
Write-Host ""
Write-Host "🔧 To customize: ~/.claude/statusline-command.sh" -ForegroundColor Gray
Write-Host "📚 Docs: https://github.com/ClydeShen/claude-code-statusbar-setting" -ForegroundColor Gray
