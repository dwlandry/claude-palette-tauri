# Claude Palette Tauri - Project Notes

## Build Commands

```bash
# Development with hot reload (requires MinGW + cargo in PATH)
export PATH="/c/msys64/mingw64/bin:$HOME/.cargo/bin:$PATH"
npm run tauri dev

# Production build
export PATH="/c/msys64/mingw64/bin:$HOME/.cargo/bin:$PATH"
npm run tauri build

# Frontend only (for quick TypeScript verification)
npm run build
```

## Build Outputs

- Portable: `src-tauri/target/release/claude-palette-tauri.exe`
- MSI: `src-tauri/target/release/bundle/msi/Claude Palette_0.1.0_x64_en-US.msi`
- NSIS: `src-tauri/target/release/bundle/nsis/Claude Palette_0.1.0_x64-setup.exe`

## Architecture

- **Frontend**: React 19 + TypeScript + Vite (`src/`)
- **Backend**: Rust + Tauri 2.x (`src-tauri/`)
- **IPC Commands** (in `src-tauri/src/lib.rs`):
  - `get_resources` - Scans ~/.claude for resources
  - `get_project_path` - Returns CLI project path argument
  - `get_resource_content` - Reads file content for preview
  - `open_file` - Opens file in system default editor

## Key Features

- 7 layouts: List, Grid, Tabs, Favorites, Dock, Palette, Kanban
- Each layout has Standard/Enhanced variants
- Markdown preview modal (double-click to preview, Shift+double-click to open in editor)
- Drag resources to paste into Claude Code
- Multi-select with copy support
- Always-on-top pin button

## Dependencies Note

The syntax highlighter (`react-syntax-highlighter`) adds ~1MB to the JS bundle. This is expected and causes the Vite chunk size warning during build.

## Type Definitions

- Frontend types: `src/types.ts` (Resource, ResourceGroup)
- Layout types: `src/layouts/types.ts` (LayoutProps, LayoutType, LayoutVariant)
- Rust types mirror frontend in `src-tauri/src/lib.rs`

## Common Issues

- **"dlltool.exe not found"**: Add MinGW to PATH: `export PATH="/c/msys64/mingw64/bin:$PATH"`
- **"cargo not found"**: Add to PATH: `export PATH="$HOME/.cargo/bin:$PATH"`
- **"Access denied" on build**: Close any running instance of the app first
- **Exe locked during build**: The app may be running in background, check Task Manager
