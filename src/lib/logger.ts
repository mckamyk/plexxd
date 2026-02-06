export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
	timestamp: string
	level: LogLevel
	message: string
}

const MAX_LOGS = 1000

class Logger {
	private logs: LogEntry[] = []
	private listeners: Set<(logs: LogEntry[]) => void> = new Set()
	private filterLevel: LogLevel | null = null

	debug(message: string): void {
		this.add("debug", message)
	}

	info(message: string): void {
		this.add("info", message)
	}

	warn(message: string): void {
		this.add("warn", message)
	}

	error(message: string): void {
		this.add("error", message)
	}

	private add(level: LogLevel, message: string): void {
		const timestamp = new Date().toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
		})

		this.logs.push({ timestamp, level, message })

		if (this.logs.length > MAX_LOGS) {
			this.logs.shift()
		}

		this.notify()
	}

	getLogs(filterLevel?: LogLevel | null): LogEntry[] {
		const level = filterLevel ?? this.filterLevel
		if (level) {
			return this.logs.filter((l) => l.level === level)
		}
		return [...this.logs]
	}

	clear(): void {
		this.logs = []
		this.notify()
	}

	setFilter(level: LogLevel | null): void {
		this.filterLevel = level
		this.notify()
	}

	getFilter(): LogLevel | null {
		return this.filterLevel
	}

	onChange(callback: (logs: LogEntry[]) => void): () => void {
		this.listeners.add(callback)
		return () => {
			this.listeners.delete(callback)
		}
	}

	private notify(): void {
		const data = this.getLogs()
		for (const cb of this.listeners) {
			cb(data)
		}
	}
}

export const log = new Logger()
