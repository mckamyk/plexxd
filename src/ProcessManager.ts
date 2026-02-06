import { log } from "./lib/logger"
import type { ProcessInfo, ProcessMap } from "./types"

type OutputCallback = (line: string) => void

export class ProcessManager {
	private processes: ProcessMap = new Map()
	private outputCallbacks: Map<string, Set<OutputCallback>> = new Map()

	spawn(processId: string, packagePath: string, scriptName: string): boolean {
		if (this.processes.has(processId)) {
			return false
		}

		try {
			const cwd = packagePath
				? `${process.cwd()}/${packagePath}`
				: process.cwd()
			const proc = Bun.spawn({
				cmd: ["bun", "run", scriptName],
				cwd,
				stdout: "pipe",
				stderr: "pipe",
				env: process.env,
			})

			const processInfo: ProcessInfo = {
				packagePath,
				processId,
				scriptName,
				process: proc,
				isRunning: true,
				output: [],
			}

			this.processes.set(processId, processInfo)

			// Handle stdout
			const stdoutReader = proc.stdout?.getReader()
			const stderrReader = proc.stderr?.getReader()
			const decoder = new TextDecoder()

			const readStream = async (
				reader: ReadableStreamDefaultReader<Uint8Array> | undefined,
				isError: boolean,
			): Promise<void> => {
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
								const info = this.processes.get(processId)
								if (info) {
									info.output.push(formattedLine)
									if (info.output.length > 1000) {
										info.output.shift()
									}
								}
								this.notifyOutput(processId, formattedLine)
							}
						}
					}
				} catch (error) {
					log.error(
						`Error reading ${isError ? "stderr" : "stdout"}: ${error instanceof Error ? error.message : error}`,
					)
				}
			}

			void readStream(stdoutReader, false)
			void readStream(stderrReader, true)

			// Handle process exit
			void proc.exited.then((code) => {
				const info = this.processes.get(processId)
				if (info) {
					info.isRunning = false
					info.exitCode = code ?? undefined
					info.output.push(`\n\x1b[33mProcess exited with code ${code}\x1b[0m`)
				}
				this.notifyOutput(
					processId,
					`\n\x1b[33mProcess exited with code ${code}\x1b[0m`,
				)
			})

			log.info(`Spawned process ${processId}`)
			return true
		} catch (error) {
			log.error(
				`Failed to spawn ${scriptName}: ${error instanceof Error ? error.message : error}`,
			)
			return false
		}
	}

	kill(scriptName: string): boolean {
		const info = this.processes.get(scriptName)
		if (!info || !info.isRunning) {
			return false
		}

		try {
			info.process.kill(15) // SIGTERM
			info.isRunning = false
			log.info(`Killed process ${scriptName}`)
			return true
		} catch (error) {
			log.error(
				`Failed to kill ${scriptName}: ${error instanceof Error ? error.message : error}`,
			)
			return false
		}
	}

	killAll(): void {
		for (const [, info] of this.processes) {
			if (info.isRunning) {
				try {
					info.process.kill(15)
				} catch (error) {
					log.error(
						`Failed to kill process: ${error instanceof Error ? error.message : error}`,
					)
				}
			}
		}
		this.processes.clear()
	}

	getOutput(scriptName: string): string[] {
		return this.processes.get(scriptName)?.output || []
	}

	isRunning(scriptName: string): boolean {
		return this.processes.get(scriptName)?.isRunning || false
	}

	onOutput(scriptName: string, callback: OutputCallback): () => void {
		let cbs = this.outputCallbacks.get(scriptName)

		if (!cbs) {
			cbs = new Set()
			this.outputCallbacks.set(scriptName, cbs)
		}
		cbs.add(callback)

		return () => {
			this.outputCallbacks.get(scriptName)?.delete(callback)
		}
	}

	private notifyOutput(scriptName: string, line: string): void {
		const callbacks = this.outputCallbacks.get(scriptName)
		if (callbacks) {
			for (const cb of callbacks) {
				try {
					cb(line)
				} catch (error) {
					log.error(
						`Output callback error: ${error instanceof Error ? error.message : error}`,
					)
				}
			}
		}
	}
}
