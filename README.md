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

### Option 1: Installer (Recommended)
Download `Claude Palette_0.1.0_x64-setup.exe` from [Releases](https://github.com/dwlandry/claude-palette-tauri/releases)

Run the installer - done!

### Option 2: Portable
Download `claude-palette-tauri.exe` - no installation needed, just run it.

### Option 3: MSI (Enterprise)
Download `Claude Palette_0.1.0_x64_en-US.msi` for GPO deployment.

---

## Quick Start

**Global mode** - see all your `~/.claude` resources:
```
Double-click "Claude Palette.exe"
```

**Project mode** - include local `.claude` resources too:
```
claude-palette-tauri.exe "C:\path\to\your\project"
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
| **Double-click** | Open in default editor |
| **Click** | Select (multi-select works!) |
| **Pin button** | Keep window always on top |

**Smart Copy:**
- Commands paste as `/command-name` (ready to execute)
- Other resources paste as `<type>path</type>`
- Project files use relative paths

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
├── claude-palette-tauri.exe          # Portable
└── bundle/
    ├── msi/Claude Palette_*.msi      # MSI installer
    └── nsis/Claude Palette_*-setup.exe  # NSIS installer
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
  ├── layouts/          # 6 layout components
  └── utils/            # Helpers
src-tauri/              # Rust backend
  └── src/lib.rs        # Scanner + IPC commands
```

---

<div align="center">

**Created by David Landry**

*Now 92% lighter. Same great taste.*

</div>
