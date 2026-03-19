# Font Configuration for Status Bar

The status bar uses emoji and special characters for better visual display. This guide helps you install the required fonts.

## 🎯 Required Fonts

| Character | Font | Platform |
|-----------|------|----------|
| 📁 📊 🚀 | System Emoji | All platforms |
| 🌿 💰 ⏱️ | System Emoji | All platforms |
| █ ░ | Block elements | Monospace font |
| │ ─ ┌ ┐ └ ┘ | Box drawing | Monospace font |

## 🖥️ Platform-Specific Installation

### macOS

**Option 1: Using setup script (Recommended)**
```bash
./setup-macos.sh
```

**Option 2: Manual install**
```bash
# Install Noto Color Emoji
brew install --cask font-noto-color-emoji

# Install Meslo LG (popular terminal font)
brew install --cask font-meslo-lg-nerd-font
```

**Recommended Terminal Fonts:**
- Meslo LG NF (best for powerlevel10k)
- JetBrains Mono Nerd Font
- Fira Code Nerd Font
- Hack Nerd Font

### Linux

**Option 1: Using setup script (Recommended)**
```bash
./setup-linux.sh
```

**Option 2: Manual install**

**Debian/Ubuntu:**
```bash
sudo apt-get install fonts-noto-color-emoji fonts-firacode
```

**Fedora/RHEL:**
```bash
sudo dnf install google-noto-color-emoji-fonts fira-code-fonts
```

**Arch Linux:**
```bash
sudo pacman -S noto-fonts-emoji ttf-fira-code
```

### Windows

**Option 1: Using setup script (Recommended)**
```powershell
.\setup-windows.ps1
```

**Option 2: Manual install**

Windows 10+ has built-in emoji support. For additional fonts:

```powershell
# Install Noto Color Emoji
$FontUrl = "https://github.com/googlefonts/noto-emoji/raw/main/fonts/NotoColorEmoji.ttf"
$FontPath = "$env:LOCALAPPDATA\Microsoft\Windows\Fonts\NotoColorEmoji.ttf"
Invoke-WebRequest -Uri $FontUrl -OutFile $FontPath -UseBasicParsing
```

**Recommended Terminal Fonts:**
- [Cascadia Code PL](https://github.com/microsoft/cascadia-code) (Windows Terminal default)
- [JetBrains Mono Nerd Font](https://www.nerdfonts.com/font-downloads)
- [Fira Code](https://github.com/tonsky/FiraCode)

## 🔧 Terminal Configuration

### iTerm2 (macOS)

1. Open iTerm2 → Preferences → Profiles → Text
2. Set **Non-ASCII Font** to `Meslo LG NF` or `JetBrains Mono Nerd Font`
3. Check **Use Ligatures**

### Windows Terminal

1. Open Settings (Ctrl+,)
2. Add to `settings.json`:
```json
{
  "profiles": {
    "defaults": {
      "fontFace": "Cascadia Code PL",
      "fontSize": 12
    }
  }
}
```

### VS Code Terminal

1. Open Settings (Ctrl+,)
2. Search for `terminal.integrated.fontFamily`
3. Set to: `'Meslo LG NF', 'Fira Code', monospace`

## ✅ Verify Installation

Run this test:

```bash
echo "📁 🌿 💰 ⏱️ 🚀 ✅ ❌ ⚠️"
echo "[████████░░] 80%"
echo "│ test │"
```

You should see:
- Colorful emoji (not boxes)
- Proper block characters
- Aligned box drawing characters

## 🔧 Troubleshooting

### Emoji shows as boxes

**Solution:** Install Noto Color Emoji font and restart terminal.

### Block characters misaligned

**Solution:** Use a monospace font with proper character width.

### Recommended fonts for status bar:

| Font | Emoji Support | Ligatures | Nerd Font Icons |
|------|--------------|-----------|-----------------|
| Meslo LG NF | ✅ | ✅ | ✅ |
| JetBrains Mono NF | ✅ | ✅ | ✅ |
| Fira Code | ❌ | ✅ | ❌ |
| Cascadia Code PL | ✅ | ✅ | ✅ |
| Hack Nerd Font | ✅ | ❌ | ✅ |
