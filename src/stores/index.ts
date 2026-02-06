import { join } from "node:path"
import { useStore } from "@tanstack/react-store"
import { Store } from "@tanstack/store"
import { darkTheme, lightTheme, type ThemeMode } from "../config/themes"
import { log } from "../lib/logger"
import {
	buildFlatList,
	detectAndLoadWorkspace,
	detectWorkspaceType,
} from "../lib/monorepo"
import type { ProcessId, ProcessInfo, ProcessMap, SpawnResult } from "../types"
import outputStore from "./outputStore"

// Cache bun availability check
let bunAvailable: boolean | null = null

function checkBunAvailable(): boolean {
	if (bunAvailable !== null) {
		return bunAvailable
	}

	try {
		Bun.spawn({
			cmd: ["bun", "--version"],
			stdout: "ignore",
			stderr: "ignore",
		})
		bunAvailable = true
		return true
	} catch {
		bunAvailable = false
		return false
	}
}

function getResolvedTheme(theme: ThemeMode): "light" | "dark" {
	if (theme === "light") return "light"
	if (theme === "dark") return "dark"

	const isDark = detectSystemDarkMode()
	return isDark ? "dark" : "light"
}

function detectSystemDarkMode(): boolean {
	const termProgram = process.env.TERM_PROGRAM?.toLowerCase()

	if (process.env.THEME?.toLowerCase() === "dark") return true
	if (process.env.THEME?.toLowerCase() === "light") return false

	if (termProgram === "apple_terminal") {
		return false
	}

	if (termProgram === "iterm2") {
		const colorFGBG = process.env.COLORFGBG
		if (colorFGBG) {
			const parts = colorFGBG.split(";")
			if (parts.length >= 2) {
				const bg = parseInt(parts[1], 10)
				return bg <= 6
			}
		}
	}

	return false
}

// Workspace data (loaded at startup)
export const packages = await detectAndLoadWorkspace()
export const workspaceType = detectWorkspaceType(process.cwd())
export const scripts = buildFlatList(packages)

// Unified Store State
interface AppState {
	// Process management
	processes: ProcessMap
	selectedId?: ProcessId

	// Theme
	themeSetting: "dark" | "light" | "system"

	// View visibility
	view: {
		commandPallete: boolean
		logViewer: boolean
		terminalOutput: boolean
	}
}

// Create unified store
export const appStore = new Store<AppState>({
	processes: new Map(),
	selectedId: scripts[0]?.id,
	themeSetting: "system",
	view: {
		logViewer: false,
		commandPallete: false,
		terminalOutput: false,
	},
})

// Theme hooks and functions
export const useTheme = () => {
	const setting = useStore(appStore, (s) => s.themeSetting)
	const theme = getResolvedTheme(setting)

	const setTheme = (theme: "dark" | "light" | "system") => {
		appStore.setState((prev) => ({ ...prev, themeSetting: theme }))
	}

	const t = theme === "light" ? lightTheme : darkTheme

	return { setting, theme, setTheme, t }
}

// View hooks
const viewSetter = (key: keyof AppState["view"]) => {
	return (value: boolean | ((prev: boolean) => boolean)) => {
		if (typeof value === "boolean") {
			appStore.setState((s) => ({ ...s, view: { ...s.view, [key]: value } }))
		} else {
			appStore.setState((s) => ({
				...s,
				view: { ...s.view, [key]: value(s.view[key]) },
			}))
		}
	}
}

export const useFocus = () => {
	const state = useStore(appStore, (s) => s.view)

	if (state.commandPallete) return "commandPallete"
	if (state.logViewer) return "logViewer"
	if (state.terminalOutput) return "terminalOutput"
	return "scriptList"
}

export const useLogViewer = () => {
	const active = useStore(appStore, (s) => s.view.logViewer)
	const setActive = viewSetter("logViewer")
	return [active, setActive] as const
}

export const useCommandPallete = () => {
	const active = useStore(appStore, (s) => s.view.commandPallete)
	const setActive = viewSetter("commandPallete")
	return [active, setActive] as const
}

export const useTerminalOutput = () => {
	const active = useStore(appStore, (s) => s.view.terminalOutput)
	const setActive = viewSetter("terminalOutput")
	return [active, setActive] as const
}

export const useModalIsOpened = () => {
	return useStore(appStore, (s) => s.view.logViewer || s.view.commandPallete)
}

// Process management functions
// Output callbacks registry (not in store state, but module-level)
const outputCallbacks = new Map<ProcessId, Set<(line: string) => void>>()

export function spawnProcess(
	processId: ProcessId,
	packagePath: string,
	scriptName: string,
): SpawnResult {
	const currentProcesses = appStore.state.processes

	log.info(
		`Spawning process ${processId} with script ${scriptName} in workspace type ${workspaceType}`,
	)

	if (currentProcesses.has(processId)) {
		return { success: false }
	}

	try {
		const cwd = packagePath ? join(process.cwd(), packagePath) : process.cwd()

		const hasBun = checkBunAvailable()
		const cmd = hasBun
			? ["bun", "run", scriptName]
			: workspaceType === "pnpm"
				? ["pnpm", "run", scriptName]
				: workspaceType === "yarn"
					? ["yarn", scriptName]
					: workspaceType === "npm"
						? ["npm", "run", scriptName]
						: ["bun", "run", scriptName]

		const proc = Bun.spawn({
			cmd,
			cwd,
			stdout: "pipe",
			stderr: "pipe",
			env: process.env,
		})

		log.info(`Spawned process ${processId} with command ${cmd.join(" ")}`)

		const processInfo: ProcessInfo = {
			processId,
			packagePath,
			scriptName,
			process: proc,
			isRunning: true,
			exitCode: undefined,
		}

		appStore.setState((prev) => {
			const next = new Map(prev.processes)
			next.set(processId, processInfo)
			return { ...prev, processes: next }
		})

		// Handle stdout/stderr streams
		const stdoutReader = proc.stdout?.getReader()
		const stderrReader = proc.stderr?.getReader()
		const decoder = new TextDecoder()

		const readStream = async (
			reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
			isError: boolean,
		) => {
			if (!reader) return

			try {
				while (true) {
					const { done, value } = await reader.read()
					if (done) break

					const text = decoder.decode(value, { stream: true })
					const lines = text.split("\n")

					for (const line of lines) {
						if (line || isError) {
							const formattedLine = isError ? `\x1b[31m${line}\x1b[0m` : line
							outputStore.appendOutput(processId, formattedLine)
						}
					}
				}
			} catch (error) {
				log.error(
					`Error reading ${isError ? "stderr" : "stdout"}: ${error instanceof Error ? error.message : error}`,
				)
			}
		}

		readStream(stdoutReader, false)
		readStream(stderrReader, true)

		// Handle process exit
		proc.exited.then((code) => {
			const exitMessage = `\n\x1b[33mProcess exited with code ${code}\x1b[0m`
			outputStore.appendOutput(processId, exitMessage)
		})

		return { success: true }
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		return { success: false, error: err }
	}
}

export function killProcess(processId: ProcessId): boolean {
	const processes = appStore.state.processes
	const info = processes.get(processId)

	if (!info || !info.isRunning) {
		return false
	}

	try {
		info.process.kill(15) // SIGTERM
		appStore.setState((prev) => {
			const next = new Map(prev.processes)
			const updated = next.get(processId)
			if (updated) {
				updated.isRunning = false
			}
			return { ...prev, processes: next }
		})
		return true
	} catch (error) {
		log.error(
			`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
		)
		return false
	}
}

export function killAllProcesses(): void {
	const processes = appStore.state.processes

	for (const [processId, info] of processes) {
		if (info.isRunning) {
			try {
				info.process.kill(15)
				outputStore.clearOutput(processId)
			} catch (error) {
				log.error(
					`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
				)
			}
		}
	}

	appStore.setState((prev) => ({ ...prev, processes: new Map() }))
}

export function isProcessRunning(processId: ProcessId): boolean {
	return appStore.state.processes.get(processId)?.isRunning || false
}

export function onProcessOutput(
	processId: ProcessId,
	callback: (line: string) => void,
): () => void {
	if (!outputCallbacks.has(processId)) {
		outputCallbacks.set(processId, new Set())
	}
	outputCallbacks.get(processId)?.add(callback)

	return () => {
		outputCallbacks.get(processId)?.delete(callback)
	}
}

export const viewStore = {
	get state() {
		return appStore.state.view
	},
	setState: (
		view: AppState["view"] | ((prev: AppState["view"]) => AppState["view"]),
	) => {
		if (typeof view === "function") {
			appStore.setState((prev) => ({ ...prev, view: view(prev.view) }))
		} else {
			appStore.setState((prev) => ({ ...prev, view }))
		}
	},
}
