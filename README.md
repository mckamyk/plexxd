# Plexxd

A terminal multiplexer for managing package.json scripts in monorepos and single-package projects. Built with TypeScript, Bun, and OpenTUI.

## Features

- Self-contained binary (64MB)
- **Monorepo support**: Automatically detects pnpm, npm, and yarn workspaces
- **Collapsible package sections**: Organize scripts by package with expand/collapse
- Split-pane UI: scripts list on left, terminal output on right
- Run multiple scripts simultaneously (even same script name from different packages)
- Keyboard-driven interface with vim-style navigation
- Cross-platform builds available

## Installation

### NPM (macOS ARM64 only)

```bash
# Install globally
npm install -g @mckamyk/plexxd

# Or use with npx
npx @mckamyk/plexxd
```

**Supported Platforms:**
- ✅ macOS ARM64 (M1/M2/M3/M4)
- ✅ macOS x64 (Intel) - Runs via Rosetta 2

**Other Platforms:**  
For Linux and Windows, download binaries from [GitHub Releases](https://github.com/mckamyk/plexxd/releases) or [build from source](#build-from-source).

### Download Pre-built Binary

```bash
# macOS ARM64
curl -L -o plexxd https://github.com/mckamyk/plexxd/releases/latest/download/plexxd-darwin-arm64
chmod +x plexxd

# Linux x64
curl -L -o plexxd https://github.com/mckamyk/plexxd/releases/latest/download/plexxd-linux-x64
chmod +x plexxd

# Windows
# Download plexxd-windows-x64.exe from releases
```

### Build from Source

```bash
git clone https://github.com/mckamyk/plexxd.git
cd plexxd
bun install
bun run build
```

## Usage

Navigate to any project with a `package.json` and run:

```bash
plexxd

# Or if installed locally
npx @mckamyk/plexxd

# Or with downloaded binary
./plexxd
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` or `j` / `k` | Navigate through headers and scripts |
| `Enter` | On script: toggle start/stop; On header: expand/collapse package |
| `x` | Kill selected running script (SIGTERM) |
| `q` or `Esc` | Quit and kill all running processes |
| `Ctrl+C` | Exit (automatic cleanup) |

## UI Layout

### Single Package Mode
```
┌─────────────────────────────────────────────────────────┐
│ Scripts              │ Output: dev                       │
│ ● dev                │ > Building...                     │
│ ○ build              │ > Compiled successfully           │
│ ○ test               │                                   │
│ ○ lint               │ > Server running on port 3000    │
└─────────────────────────────────────────────────────────┘
```

### Monorepo Mode
```
┌─────────────────────────────────────────────────────────┐
│ Scripts              │ Output: apps/web/dev              │
│ ● dev                │ > vite v5.0.0 dev server running  │
│ ○ build              │ > Local: http://localhost:5173    │
│ ○ test               │                                   │
│ ─────────────────    │                                   │
│ ▼ apps/web (3)       │                                   │
│   ● dev              │                                   │
│   ○ build            │                                   │
│   ○ preview          │                                   │
│ ─────────────────    │                                   │
│ ▶ packages/ui (2) ●  │                                   │
│ ─────────────────    │                                   │
│ ▼ apps/api (2)       │                                   │
│   ○ dev              │                                   │
│   ○ start            │                                   │
└─────────────────────────────────────────────────────────┘
```

**Left pane (30%)**:
- Root scripts shown at top (no header)
- Package sections with collapse/expand (`▶`/`▼`)
- Indented scripts under each package
- `●` = Running (green), `○` = Stopped (gray)
- Collapsed packages show `●` indicator if any child script is running
- Highlighted = Currently selected (blue background)

**Right pane (70%)**:
- Shows terminal output of selected script
- Title shows full process ID (e.g., `apps/web/dev` or just `dev` for root)
- Real-time output with ANSI color support

## Building for Multiple Platforms

```bash
# Build for all platforms
bun run build:all

# Or individually:
bun build src/index.tsx --outfile=plexxd-darwin-arm64 --compile --target=bun-darwin-arm64
bun build src/index.tsx --outfile=plexxd-linux-x64 --compile --target=bun-linux-x64
bun build src/index.tsx --outfile=plexxd-windows-x64.exe --compile --target=bun-windows-x64
```

## Monorepo Support

Plexxd automatically detects and supports:

- **pnpm workspaces** (via `pnpm-workspace.yaml`)
- **npm workspaces** (via `workspaces` field in package.json)
- **yarn workspaces** (via `workspaces` field in package.json)
- **Turborepo** (via workspace config + turbo.json)

### Features

- Packages are grouped and alphabetically sorted
- Scripts with the same name in different packages can run simultaneously
- Each script runs in its package's directory (correct `cwd`)
- Collapse/expand package sections to reduce visual clutter
- Running indicator on collapsed packages shows if any child script is active

### Fallback Behavior

If workspace config exists but no valid packages are found, plexxd falls back to single-package mode.

## How It Works

1. **Workspace Detection**: Checks for pnpm-workspace.yaml, then package.json workspaces field
2. **Package Discovery**: Expands glob patterns (e.g., `apps/*`) and validates package.json existence
3. **Process Management**: Uses `Bun.spawn()` with correct `cwd` per package
4. **UI Rendering**: OpenTUI provides a React-based TUI with flexbox layout
5. **State Management**: React hooks manage flat list rendering, collapse state, and process outputs
6. **Keyboard Handling**: `useKeyboard` hook captures all input for navigation and control

## Architecture

```
plexxd/
├── src/
│   ├── index.tsx                 # Entry point - initializes OpenTUI renderer
│   ├── components/
│   │   ├── App.tsx              # Main app with keyboard handling, flat list builder
│   │   ├── ScriptList.tsx       # Left pane - renders headers, separators, scripts
│   │   └── TerminalOutput.tsx   # Right pane - displays process output
│   ├── hooks/
│   │   ├── useMonorepo.ts       # Detects workspace type, loads all packages
│   │   └── useProcessManager.ts # Spawns/kills processes with processId keys
│   └── types/
│       └── index.ts             # TypeScript interfaces for workspace, processes
├── package.json
└── tsconfig.json
```

### Key Design Decisions

- **Flat list rendering**: Packages, headers, and scripts are flattened into a single navigable list
- **ProcessId format**: `"apps/web/dev"` for package scripts, `"dev"` for root scripts
- **Collapse state**: Managed with `Set<string>` of collapsed package paths
- **Running indicators**: Calculated dynamically by checking if any child script is running

## Development

```bash
# Run in dev mode (requires Bun)
bun run dev

# Type check
bun tsc --noEmit
```

## Requirements

- [Bun](https://bun.sh/) runtime (for building)
- Node.js projects with package.json

## License

MIT
