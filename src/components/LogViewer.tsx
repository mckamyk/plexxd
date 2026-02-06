import { useKeyboard } from "@opentui/react"
import { useCallback, useMemo, useState } from "react"
import { useLogViewer } from "../hooks/useView"
import { type LogLevel, log } from "../lib/logger"
import { useTheme } from "../stores/themeStore"

const FILTER_CYCLE: (LogLevel | null)[] = [
	null,
	"debug",
	"info",
	"warn",
	"error",
]

export function LogViewer() {
	const [filterIndex, setFilterIndex] = useState(0) // Start at index 0 (show all logs)
	const { t } = useTheme()

	const [isOpen, setIsOpen] = useLogViewer()

	useKeyboard(
		useCallback(
			(key) => {
				if (key.name === "f12") {
					setIsOpen((prev) => !prev)
				}
			},
			[setIsOpen],
		),
	)

	// Use theme colors for log levels
	const levelColors: Record<LogLevel, string> = {
		debug: t.textTertiary,
		info: t.info,
		warn: t.warning,
		error: t.error,
	}

	const filterLevel = FILTER_CYCLE[filterIndex]

	const logs = useMemo(() => {
		return log.getLogs(filterLevel)
	}, [filterLevel])

	useKeyboard(
		useCallback(
			(key) => {
				if (!isOpen) {
					if (key.name === "f12") setIsOpen(true)
					return
				}
				switch (key.name) {
					case "f":
						setFilterIndex((prev) => (prev + 1) % FILTER_CYCLE.length)
						break
					case "escape":
					case "q":
					case "f12":
						setIsOpen(false)
						break
				}
			},
			[setIsOpen, isOpen],
		),
	)

	const filterLabel =
		filterLevel === null
			? "All"
			: filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)

	if (!isOpen) return null

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

			<scrollbox
				style={{
					flexGrow: 1,
					flexDirection: "column",
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
				}}
			>
				{logs.length === 0 ? (
					<text fg={t.textTertiary} attributes={2}>
						No logs to display
					</text>
				) : (
					logs.map((log, index) => (
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
			</scrollbox>

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
				<text>{logs.length} logs</text>
				<box style={{ flexGrow: 1 }} />
				<text>j/k or ↑/↓ to scroll | g/G to jump top/bottom</text>
			</box>
		</box>
	)
}
