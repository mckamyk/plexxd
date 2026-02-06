import { join } from "node:path"
import { useCallback, useEffect, useRef, useState } from "react"
import { log } from "../lib/logger"
import type {
	ProcessId,
	ProcessManager,
	ProcessMap,
	SpawnResult,
	WorkspaceType,
} from "../types"

// Cache bun availability check
let bunAvailable: boolean | null = null

function checkBunAvailable(): boolean {
	if (bunAvailable !== null) {
		return bunAvailable
	}

	try {
		// Try to spawn bun --version synchronously
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

export function useProcessManager(): ProcessManager {
	const [processes, setProcesses] = useState<ProcessMap>(new Map())
	const processesRef = useRef<ProcessMap>(processes)
	const outputCallbacks = useRef<Map<ProcessId, Set<(line: string) => void>>>(
		new Map(),
	)

	// Keep ref in sync with state for cleanup
	useEffect(() => {
		processesRef.current = processes
	}, [processes])

	const notifyOutput = useCallback((processId: ProcessId, line: string) => {
		const callbacks = outputCallbacks.current.get(processId)
		if (callbacks) {
			callbacks.forEach((cb) => void cb(line))
		}
	}, [])

	const spawn = useCallback(
		(
			processId: ProcessId,
			packagePath: string,
			scriptName: string,
			workspaceType: WorkspaceType,
		): SpawnResult => {
			log.info(
				`Spawning process ${processId} with script ${scriptName} in workspace type ${workspaceType}`,
			)
			if (processes.has(processId)) {
				return { success: false }
			}

			try {
				const cwd = packagePath
					? join(process.cwd(), packagePath)
					: process.cwd()

				// Build command: prefer bun if available, otherwise use package manager
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
					cwd: cwd,
					stdout: "pipe",
					stderr: "pipe",
					env: process.env,
				})
				log.info(`Spawned process ${processId} with command ${cmd.join(" ")}`)

				const processInfo = {
					processId,
					packagePath,
					scriptName,
					process: proc,
					isRunning: true,
					output: [],
					exitCode: undefined,
				}

				setProcesses((prev) => {
					const next = new Map(prev)
					next.set(processId, processInfo)
					return next
				})

				// Handle stdout
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
									const formattedLine = isError
										? `\x1b[31m${line}\x1b[0m`
										: line

									setProcesses((prev) => {
										const next = new Map(prev)
										const info = next.get(processId)
										if (info) {
											info.output.push(formattedLine)
											if (info.output.length > 1000) {
												info.output.shift()
											}
										}
										return next
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
					setProcesses((prev) => {
						const next = new Map(prev)
						const info = next.get(processId)
						if (info) {
							info.isRunning = false
							info.exitCode = code ?? undefined
							info.output.push(
								`\n\x1b[33mProcess exited with code ${code}\x1b[0m`,
							)
						}
						return next
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
		},
		[processes, notifyOutput],
	)

	const kill = useCallback(
		(processId: ProcessId): boolean => {
			const info = processes.get(processId)
			if (!info || !info.isRunning) {
				return false
			}

			try {
				info.process.kill(15) // SIGTERM
				setProcesses((prev) => {
					const next = new Map(prev)
					const updated = next.get(processId)
					if (updated) {
						updated.isRunning = false
					}
					return next
				})
				return true
			} catch (error) {
				log.error(
					`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
				)
				return false
			}
		},
		[processes],
	)

	const killAll = useCallback(() => {
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
		setProcesses(new Map())
	}, [processes])

	const getOutput = useCallback(
		(processId: ProcessId): string[] => {
			return processes.get(processId)?.output || []
		},
		[processes],
	)

	const isRunning = useCallback(
		(processId: ProcessId): boolean => {
			return processes.get(processId)?.isRunning || false
		},
		[processes],
	)

	const onOutput = useCallback(
		(processId: ProcessId, callback: (line: string) => void): (() => void) => {
			if (!outputCallbacks.current.has(processId)) {
				outputCallbacks.current.set(processId, new Set())
			}
			outputCallbacks.current.get(processId)?.add(callback)

			return () => {
				outputCallbacks.current.get(processId)?.delete(callback)
			}
		},
		[],
	)

	// Cleanup on unmount only
	useEffect(() => {
		return () => {
			// Only kill processes on actual unmount, not on re-renders
			const currentProcesses = processesRef.current
			for (const [processId, info] of currentProcesses) {
				if (info.isRunning) {
					try {
						info.process.kill(15)
						log.info(`Killed process ${processId} on unmount`)
					} catch (error) {
						log.error(
							`Failed to kill ${processId}: ${error instanceof Error ? error.message : error}`,
						)
					}
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return {
		processes,
		spawn,
		kill,
		killAll,
		getOutput,
		isRunning,
		onOutput,
	}
}
