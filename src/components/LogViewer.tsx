import { useKeyboard } from "@opentui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useConfig } from "../hooks/useConfig"
import { type LogEntry, type LogLevel, log } from "../lib/logger"

const FILTER_CYCLE: (LogLevel | null)[] = [
	null,
	"debug",
	"info",
	"warn",
	"error",
]

export function LogViewer({ onClose }: { onClose: () => void }) {
	const [logs, setLogs] = useState<LogEntry[]>([])
	const [scrollOffset, setScrollOffset] = useState(0)
	const [filterIndex, setFilterIndex] = useState(0) // Start at index 0 (show all logs)
	const { currentTheme: t } = useConfig()

	// Use theme colors for log levels
	const levelColors: Record<LogLevel, string> = {
		debug: t.textTertiary,
		info: t.info,
		warn: t.warning,
		error: t.error,
	}

	const filterLevel = FILTER_CYCLE[filterIndex]

	useEffect(() => {
		log.setFilter(filterLevel)
		setLogs(log.getLogs(filterLevel))

		const unsubscribe = log.onChange((newLogs) => {
			setLogs(newLogs)
		})

		return unsubscribe
	}, [filterLevel])

	const maxScroll = Math.max(0, logs.length - 1)

	useKeyboard(
		useCallback(
			(key) => {
				switch (key.name) {
					case "up":
					case "k":
						setScrollOffset((prev) => Math.max(0, prev - 1))
						break
					case "down":
					case "j":
						setScrollOffset((prev) => Math.min(maxScroll, prev + 1))
						break
					case "c":
						log.clear()
						setScrollOffset(0)
						break
					case "f":
						setFilterIndex((prev) => (prev + 1) % FILTER_CYCLE.length)
						break
					case "escape":
					case "q":
					case "f12":
						onClose()
						break
					case "g":
						if (key.ctrl) {
							setScrollOffset(0)
						}
						break
					case "G":
						setScrollOffset(maxScroll)
						break
				}
			},
			[onClose, maxScroll],
		),
	)

	const visibleLogs = useMemo(() => {
		// Show logs in reverse order (newest first), limited by scroll offset
		const reversed = [...logs].reverse()
		return reversed.slice(scrollOffset, scrollOffset + 50) // Show up to 50 lines
	}, [logs, scrollOffset])

	const filterLabel =
		filterLevel === null
			? "All"
			: filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)

	return (
		<box
			style={{
				position: "absolute",
				left: "10%",
				top: "10%",
				width: "80%",
				height: "80%",
				flexDirection: "column",
				borderStyle: "single",
				backgroundColor: t.bgSecondary,
				borderColor: t.border,
				zIndex: 100,
			}}
		>
			<box
				border={["bottom"]}
				style={{
					flexDirection: "row",
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
					backgroundColor: t.bgTertiary,
				}}
			>
				<text attributes={1}>Logs</text>
				<box style={{ flexGrow: 1 }} />
				<text>Filter: {filterLabel} (f)</text>
				<box style={{ width: 2 }} />
				<text>Clear (c)</text>
				<box style={{ width: 2 }} />
				<text>Close (F12/ESC/q)</text>
			</box>

			<box
				style={{
					flexGrow: 1,
					flexDirection: "column",
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
				}}
			>
				{visibleLogs.length === 0 ? (
					<text fg={t.textTertiary} attributes={2}>
						No logs to display
					</text>
				) : (
					visibleLogs.map((log, index) => (
						<box
							key={`${log.timestamp}-${index}`}
							style={{ flexDirection: "row" }}
						>
							<text fg={t.textTertiary}>[{log.timestamp}]</text>
							<box style={{ width: 1 }} />
							<text fg={levelColors[log.level]} attributes={1}>
								{log.level.toUpperCase()}
							</text>
							<box style={{ width: 1 }} />
							<text fg={t.textPrimary}>{log.message}</text>
						</box>
					))
				)}
			</box>

			<box
				border={["top"]}
				style={{
					flexDirection: "row",
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
					backgroundColor: t.bgTertiary,
				}}
			>
				<text>
					{scrollOffset + 1}-
					{Math.min(scrollOffset + visibleLogs.length, logs.length)} /{" "}
					{logs.length}
				</text>
				<box style={{ flexGrow: 1 }} />
				<text>j/k or ↑/↓ to scroll | g/G to jump top/bottom</text>
			</box>
		</box>
	)
}
