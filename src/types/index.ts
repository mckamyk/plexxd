export interface ScriptInfo {
	name: string
	command: string
}

export interface PackageJson {
	name?: string
	scripts?: Record<string, string>
	workspaces?: string[] | { packages?: string[] }
}

export interface WorkspacePackage {
	path: string // "apps/web" or "" for root
	fullPath: string // absolute filesystem path
	name?: string // package.json name (optional, not displayed)
	scripts: ScriptInfo[]
	isRoot: boolean
}

export interface WorkspaceInfo {
	type: "pnpm" | "npm" | "yarn" | "single"
	root: string
	packages: WorkspacePackage[]
}

export interface ListItem {
	type: "script" | "header" | "separator"
	id: string // Unique identifier for navigation

	// For scripts
	packagePath?: string // "" for root, "apps/web" for packages
	scriptName?: string // "dev"
	command?: string

	// For headers
	collapsed?: boolean
	scriptCount?: number
	hasRunningScript?: boolean // For collapsed header indicator
}

// Process ID format: "apps/web/dev" or "dev" for root
export type ProcessId = string

export interface ProcessInfo {
	processId: ProcessId
	packagePath: string
	scriptName: string
	process: ReturnType<typeof Bun.spawn>
	isRunning: boolean
	output: string[]
	exitCode?: number
}

export type ProcessMap = Map<ProcessId, ProcessInfo>

export interface SpawnResult {
	success: boolean
	error?: Error
}

export interface ErrorDialogState {
	isOpen: boolean
	error: Error | null
	scriptName: string
	packagePath: string
}

export type WorkspaceType = "pnpm" | "npm" | "yarn" | "single"

export interface ProcessManager {
	processes: ProcessMap
	spawn: (
		processId: ProcessId,
		packagePath: string,
		scriptName: string,
		workspaceType: WorkspaceType,
	) => SpawnResult
	kill: (processId: ProcessId) => boolean
	killAll: () => void
	getOutput: (processId: ProcessId) => string[]
	isRunning: (processId: ProcessId) => boolean
	onOutput: (
		processId: ProcessId,
		callback: (line: string) => void,
	) => () => void
}

export interface Command {
	id: string
	name: string
	shortcut?: string
	description?: string
	execute: () => void
}

export interface CommandPaletteState {
	isOpen: boolean
	searchQuery: string
	selectedIndex: number
}
