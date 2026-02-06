import { join } from "node:path"
import { Store } from "@tanstack/store"
import { log } from "../lib/logger"
import { detectAndLoadWorkspace, detectWorkspaceType } from "../lib/monorepo"
import type {
	ProcessId,
	ProcessInfo,
	ProcessMap,
	SpawnResult,
	WorkspacePackage,
	WorkspaceType,
} from "../types"

// Cache bun availability check
let bunAvailable: boolean | null = null

// Create the store

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

// Store state interface
interface ProcessManagerState {
	packages: WorkspacePackage[]
	workspaceType: WorkspaceType
	processes: ProcessMap
	selectedIndex: number
	selectedId?: ProcessId
}

// Create the store
export const processManagerStore = new Store<ProcessManagerState>({
	packages: await detectAndLoadWorkspace(),
	workspaceType: detectWorkspaceType(process.cwd()),
	processes: new Map(),
	selectedIndex: 0,
	selectedId: undefined,
})

// Output callbacks registry (not in store state, but module-level)
const outputCallbacks = new Map<ProcessId, Set<(line: string) => void>>()

// Helper to notify output callbacks
function notifyOutput(processId: ProcessId, line: string): void {
	const callbacks = outputCallbacks.get(processId)
	if (callbacks) {
		callbacks.forEach((cb) => void cb(line))
	}
}

// Spawn a new process
export function spawnProcess(
	processId: ProcessId,
	packagePath: string,
	scriptName: string,
	workspaceType: WorkspaceType,
): SpawnResult {
	const currentProcesses = processManagerStore.state.processes

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
			output: [],
			numLines: 0,
			exitCode: undefined,
		}

		processManagerStore.setState((prev) => {
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

							processManagerStore.setState((prev) => {
								const next = new Map(prev.processes)
								const info = next.get(processId)
								if (info) {
									info.output.push({
										content: formattedLine,
										offset: info.numLines,
									})
									info.numLines++
									if (info.output.length > 1000) {
										info.output.shift()
									}
								}
								return { ...prev, processes: next }
							})

							notifyOutput(processId, formattedLine)
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
			processManagerStore.setState((prev) => {
				const next = new Map(prev.processes)
				const info = next.get(processId)
				if (info) {
					info.isRunning = false
					info.exitCode = code ?? undefined
					const exitMessage = `\n\x1b[33mProcess exited with code ${code}\x1b[0m`
					info.output.push({ content: exitMessage, offset: info.numLines })
					info.numLines++
				}
				return { ...prev, processes: next }
			})
			notifyOutput(
				processId,
				`\n\x1b[33mProcess exited with code ${code}\x1b[0m`,
			)
		})

		return { success: true }
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error))
		return { success: false, error: err }
	}
}

// Kill a specific process
export function killProcess(processId: ProcessId): boolean {
	const processes = processManagerStore.state.processes
	const info = processes.get(processId)

	if (!info || !info.isRunning) {
		return false
	}

	try {
		info.process.kill(15) // SIGTERM
		processManagerStore.setState((prev) => {
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

// Kill all running processes
export function killAllProcesses(): void {
	const processes = processManagerStore.state.processes

	for (const [processId, info] of processes) {
		if (info.isRunning) {
			try {
				info.process.kill(15)
			} catch (error) {
				log.error(
					`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
				)
			}
		}
	}

	processManagerStore.setState((prev) => ({ ...prev, processes: new Map() }))
}

// Get output for a process
export function getProcessOutput(processId: ProcessId): string[] {
	const info = processManagerStore.state.processes.get(processId)
	return info?.output.map((line) => line.content) || []
}

// Check if process is running
export function isProcessRunning(processId: ProcessId): boolean {
	return processManagerStore.state.processes.get(processId)?.isRunning || false
}

// Subscribe to output for a process
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

// Cleanup on app exit
export function cleanupProcesses(): void {
	const processes = processManagerStore.state.processes

	for (const [processId, info] of processes) {
		if (info.isRunning) {
			try {
				info.process.kill(15)
				log.info(`Killed process ${processId} on cleanup`)
			} catch (error) {
				log.error(
					`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
				)
			}
		}
	}
}
