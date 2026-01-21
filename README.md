# Claude Palette (Tauri Edition)

```
   _____ _                 _        _____      _      _   _
  / ____| |               | |      |  __ \    | |    | | | |
 | |    | | __ _ _   _  __| | ___  | |__) |_ _| | ___| |_| |_ ___
 | |    | |/ _` | | | |/ _` |/ _ \ |  ___/ _` | |/ _ \ __| __/ _ \
 | |____| | (_| | |_| | (_| |  __/ | |  | (_| | |  __/ |_| ||  __/
  \_____|_|\__,_|\__,_|\__,_|\___| |_|   \__,_|_|\___|\__|\__\___|
                                                    [Tauri Edition]
```

## Your Claude Code Resources, One Click Away

A lightweight rewrite of [Claude Palette](https://github.com/dwlandry/claude-palette) using Tauri + Rust instead of Electron.

---

## Download & Install

### Windows Installer (Recommended)
Download `Claude Palette_0.1.0_x64-setup.exe` from [Releases](https://github.com/dwlandry/claude-palette-tauri/releases)

Run the installer - it will automatically install WebView2 if needed.

### MSI (Enterprise/Silent Install)
Download `Claude Palette_0.1.0_x64_en-US.msi` for GPO deployment or silent install.

> **Note:** Requires [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11, installer handles this automatically).

---

## Quick Start

**Global mode** - see all your `~/.claude` resources:
```
Launch "Claude Palette" from Start Menu or desktop shortcut
```

**Project mode** - include local `.claude` resources too:
```
"C:\Users\<you>\AppData\Local\Claude Palette\claude-palette-tauri.exe" "C:\path\to\your\project"
```

---

## Size Comparison: Tauri vs Electron

| Metric | Tauri | Electron | Improvement |
|--------|-------|----------|-------------|
| **Installer** | 5.5 MB | ~65 MB | **92% smaller** |
| **Portable EXE** | 25 MB | 68 MB | **63% smaller** |
| **RAM Usage** | ~30 MB | ~150 MB | **80% less** |
| **Startup Time** | Instant | 1-2 sec | **Much faster** |

---

## Tauri vs Electron: Pros & Cons

### Tauri Advantages

| Benefit | Description |
|---------|-------------|
| **Tiny Size** | Uses system WebView instead of bundling Chromium |
| **Fast Startup** | Native Rust backend loads instantly |
| **Low Memory** | No separate browser process eating RAM |
| **Native Feel** | Uses OS-native rendering engine |
| **Security** | Rust backend with minimal attack surface |

### Tauri Limitations

| Tradeoff | Description |
|----------|-------------|
| **WebView Dependency** | Requires Edge WebView2 (pre-installed on Win10/11) |
| **Cross-platform Quirks** | Slight rendering differences across OS |
| **Newer Ecosystem** | Less tooling/plugins than Electron |

### When to Use Each

| Use Tauri When... | Use Electron When... |
|-------------------|----------------------|
| Size matters (portable tools) | Need consistent rendering everywhere |
| Low resource usage is critical | Heavy Node.js backend needed |
| Simple UI, native performance | Complex desktop integrations |
| Users have modern Windows | Must support legacy systems |

---

## Features

| Action | What Happens |
|--------|--------------|
| **Drag** any item | Pastes into Claude Code |
| **Double-click** | Preview in popup window |
| **Shift+Double-click** | Open in default editor |
| **Click** | Select (multi-select works!) |
| **Pin button** | Keep window always on top |

**Smart Copy:**
- Commands paste as `/command-name` (ready to execute)
- Other resources paste as `<type>path</type>`
- Multi-select copies all on one line (no line breaks)
- Project files use relative paths

**Preview Window:**
- Light theme optimized for readability
- YAML frontmatter displayed as metadata cards
- XML sections (`<role>`, `<constraints>`, etc.) rendered as styled blocks
- Syntax-highlighted code blocks
- Edit button to open in your default editor

**7 Layout Options:**
- List (classic collapsible groups)
- Grid (tile cards)
- Tabs (type-based grouping)
- Favorites (star your most-used)
- Dock (icon grid with hover preview)
- Palette (command palette style)
- Kanban (columns by type)

Each layout has **Standard** and **Enhanced** variants.

---

## Development

### Prerequisites
- Node.js 18+
- Rust (via rustup)
- Windows: MSYS2 with MinGW toolchain (for GNU target)

### Setup
```bash
# Install dependencies
npm install

# Run in dev mode
npm run tauri dev

# Run with project path
npm run tauri dev -- -- "C:\path\to\project"

# Build for production
npm run tauri build
```

### Build Output
```
src-tauri/target/release/
├── claude-palette-tauri.exe             # Dev/debug only (needs DLL)
├── WebView2Loader.dll                   # Required runtime dependency
└── bundle/
    ├── msi/Claude Palette_*.msi         # MSI installer (for releases)
    └── nsis/Claude Palette_*-setup.exe  # NSIS installer (for releases)
```

---

## Tech Stack

```
Tauri 2.x + React 19 + TypeScript + Vite + Rust
```

---

## Project Structure

```
src/                    # React frontend
  ├── App.tsx           # Main component
  ├── preview.tsx       # Preview window component
  ├── preview-styles.css # Preview window styles
  ├── layouts/          # 7 layout components
  └── types.ts          # TypeScript interfaces
src-tauri/              # Rust backend
  └── src/lib.rs        # Scanner + IPC commands
```

---

<div align="center">

**Created by David Landry**

*Now 92% lighter. Same great taste.*

</div>
