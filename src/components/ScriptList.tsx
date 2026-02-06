import { useTerminalDimensions } from "@opentui/react"
import { useConfig } from "../hooks/useConfig"
import type { ListItem, ProcessId } from "../types"

interface ScriptListProps {
	items: ListItem[]
	selectedIndex: number
	isRunning: (processId: ProcessId) => boolean
}

export function ScriptList({
	items,
	selectedIndex,
	isRunning,
}: ScriptListProps) {
	const { width } = useTerminalDimensions()
	const { currentTheme: t } = useConfig()

	if (items.length === 0) {
		return (
			<box
				flexBasis={width * 0.3}
				style={{
					border: true,
					flexDirection: "column",
					paddingLeft: 1,
					paddingRight: 1,
				}}
			>
				<text fg={t.textTertiary}>No scripts found in package.json</text>
			</box>
		)
	}

	return (
		<box
			flexBasis={width * 0.3}
			style={{
				border: true,
				flexDirection: "column",
				paddingLeft: 1,
				paddingRight: 1,
				backgroundColor: t.bgPrimary,
				borderColor: t.border,
			}}
		>
			<text fg={t.header} attributes={1}>
				Scripts
			</text>
			<box style={{ height: 1 }} />
			{items.map((item, index) => {
				const isSelected = index === selectedIndex

				// Separator line
				if (item.type === "separator") {
					return (
						<box
							key={item.id}
							border={["bottom"]}
							style={{
								height: 1,
								borderColor: t.border,
							}}
						/>
					)
				}

				// Package header
				if (item.type === "header") {
					return (
						<box
							key={item.id}
							style={{
								height: 1,
								backgroundColor: isSelected ? t.primary : undefined,
								flexDirection: "row",
								justifyContent: "space-between",
							}}
						>
							<text fg={isSelected ? t.selectedText : t.header}>
								{item.collapsed ? "▶" : "▼"} {item.packagePath} (
								{item.scriptCount})
							</text>
							{item.collapsed && item.hasRunningScript && (
								<text fg={t.success}>●</text>
							)}
						</box>
					)
				}

				// Script item
				const running = isRunning(item.id)
				const bg = isSelected ? t.primary : undefined
				const fg = isSelected
					? t.selectedText
					: running
						? t.success
						: t.textSecondary
				const prefix = item.packagePath ? "  " : "" // Indent package scripts

				return (
					<box
						key={item.id}
						style={{
							height: 1,
							backgroundColor: bg,
							flexDirection: "row",
						}}
					>
						<text fg={fg}>
							{prefix}
							{running ? "● " : "○ "}
							{item.scriptName}
						</text>
					</box>
				)
			})}
		</box>
	)
}
