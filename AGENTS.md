# AGENTS.md - Plexxd Coding Guidelines

This file provides guidelines for AI coding agents working on the plexxd repository.

## Project Overview

Plexxd is a terminal multiplexer for managing package.json scripts in monorepos and single-package projects. Built with TypeScript, Bun, and OpenTUI (React-based TUI framework).

## Build Commands

```bash
# Development - run the app locally
bun run dev

# Production build - compiles to binary
bun run build

# Type checking only
bun tsc --noEmit

# Cross-platform builds
bun build src/index.tsx --outfile=plexxd-darwin-arm64 --compile --target=bun-darwin-arm64
bun build src/index.tsx --outfile=plexxd-linux-x64 --compile --target=bun-linux-x64
bun build src/index.tsx --outfile=plexxd-windows-x64.exe --compile --target=bun-windows-x64
```

**Note:** There is currently no test suite configured for this project.

## Technology Stack

- **Runtime**: Bun (Node.js compatible)
- **Language**: TypeScript 5.x
- **UI Framework**: OpenTUI (@opentui/core, @opentui/react)
- **UI Library**: React 19
- **Package Manager**: Bun (uses bun.lock)
- **Module System**: ES Modules (type: "module")

## Code Style Guidelines

### Formatting

- **Indentation**: Use tabs (width: 2)
- **Semicolons**: Optional, prefer omitting when unnecessary
- **Trailing Commas**: Use in multi-line objects/arrays
- **Line Length**: No strict limit, prefer readability

### Imports

Order imports by:
1. External libraries (React, @opentui/*)
2. Node.js built-ins (fs, path)
3. Internal modules (../types, ../hooks/*)
4. Type imports: Use `import type { X } from "module"` for types

Example:
```typescript
import { useKeyboard } from "@opentui/react";
import { useCallback, useEffect } from "react";
import { join } from "path";
import type { ProcessId } from "../types";
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ScriptList`, `TerminalOutput`)
- **Hooks**: camelCase with `use` prefix (e.g., `useProcessManager`, `useMonorepo`)
- **Types/Interfaces**: PascalCase (e.g., `ProcessInfo`, `WorkspacePackage`)
- **Functions**: camelCase (e.g., `buildFlatList`, `detectWorkspaceType`)
- **Constants**: camelCase (no screaming snake case)
- **Private methods**: No underscore prefix, use explicit private modifier if needed

### TypeScript Conventions

- Enable `strict` mode (enforced in tsconfig.json)
- Use explicit return types for public functions
- Prefer `interface` over `type` for object shapes
- Use `ProcessId` type alias instead of raw strings
- Nullable values: Use `?` for optional properties
- Export all types from `src/types/index.ts`

### Error Handling

- Use try/catch for file operations and async code
- Log errors with `console.error()` including context
- Return empty arrays/objects as safe defaults
- Don't throw exceptions that crash the TUI

Example:
```typescript
try {
  const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
  return pkg.scripts || [];
} catch (error) {
  console.error(`Failed to load scripts from ${pkgJsonPath}:`, error);
  return [];
}
```

### React/OpenTUI Patterns

- Use functional components with hooks
- Prefer `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Clean up resources in `useEffect` return functions
- Access terminal dimensions via `useTerminalDimensions()`
- Handle keyboard input via `useKeyboard()` hook

### File Organization

```
src/
├── index.tsx           # Entry point
├── types/index.ts      # All TypeScript interfaces
├── components/         # React/OpenTUI components
│   ├── App.tsx        # Main application component
│   └── *.tsx          # Other UI components
├── hooks/             # Custom React hooks
│   └── use*.ts
└── *.ts               # Utility modules
```

## Key Architecture Patterns

- **Flat List Rendering**: Packages, headers, and scripts flattened into single navigable array
- **ProcessId Format**: `"apps/web/dev"` for package scripts, `"dev"` for root scripts  
- **Process Management**: Uses `Bun.spawn()` with correct `cwd` per package
- **State Management**: React hooks (useState, useCallback) - no external state library
- **Workspace Detection**: Supports pnpm, npm, yarn via glob pattern expansion

## Dependencies

- Keep external dependencies minimal
- Current runtime deps: @opentui/core, @opentui/react, js-yaml, react
- Prefer Bun APIs (Bun.spawn, Bun.Glob) over Node.js equivalents when available

## Documentation References

- OpenTUI docs: https://github.com/mckamyk/opentui (React TUI framework)
- Bun docs: https://bun.sh/docs
- Always check README.md for updated usage examples

## Before Committing

1. Run `bun tsc --noEmit` to ensure no type errors
2. Test locally with `bun run dev` in a project with package.json
3. Ensure binary builds with `bun run build`
4. No linting configured - follow code style guidelines above
