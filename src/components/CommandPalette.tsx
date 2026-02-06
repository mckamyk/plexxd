import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useConfig } from "../hooks/useConfig"
import type { Command } from "../types"

interface CommandPaletteProps {
	commands: Command[]
	isOpen: boolean
	searchQuery: string
	selectedIndex: number
	onSearchChange: (query: string) => void
	onSelectIndex: (index: number | ((prev: number) => number)) => void
	onExecute: (command: Command) => void
	onClose: () => void
}

export function CommandPalette({
	commands,
	isOpen,
	searchQuery,
	selectedIndex,
	onSearchChange,
	onSelectIndex,
	onExecute,
	onClose,
}: CommandPaletteProps) {
	const { width } = useTerminalDimensions()
	const { currentTheme: t } = useConfig()
	const [cursorPosition, setCursorPosition] = useState(0)

	// Focus on open
	useEffect(() => {
		if (isOpen) {
			setCursorPosition(searchQuery.length)
		}
	}, [isOpen, searchQuery.length])

	const filteredCommands = useMemo(() => {
		if (!searchQuery.trim()) {
			return commands.slice(0, 10)
		}
		const lowerQuery = searchQuery.toLowerCase()
		return commands
			.filter(
				(cmd) =>
					cmd.name.toLowerCase().includes(lowerQuery) ||
					cmd.id.toLowerCase().includes(lowerQuery) ||
					cmd.description?.toLowerCase().includes(lowerQuery),
			)
			.slice(0, 10)
	}, [commands, searchQuery])

	// Ensure selected index stays valid
	useEffect(() => {
		if (selectedIndex >= filteredCommands.length) {
			onSelectIndex(Math.max(0, filteredCommands.length - 1))
		}
	}, [filteredCommands.length, selectedIndex, onSelectIndex])

	const maxIndex = Math.max(0, filteredCommands.length - 1)
	const selectedCommand = filteredCommands[selectedIndex]

	useKeyboard(
		useCallback(
			(key) => {
				if (!isOpen) return

				switch (key.name) {
					case "escape":
						if (searchQuery) {
							// Clear search first, then close on next escape
							onSearchChange("")
							setCursorPosition(0)
						} else {
							onClose()
						}
						break

					case "return":
						if (selectedCommand) {
							onExecute(selectedCommand)
						}
						break

					case "up":
						onSelectIndex((prev) => Math.max(0, prev - 1))
						break

					case "down":
						onSelectIndex((prev) => Math.min(maxIndex, prev + 1))
						break

					case "tab":
						if (key.shift) {
							onSelectIndex((prev) => Math.max(0, prev - 1))
						} else {
							onSelectIndex((prev) => Math.min(maxIndex, prev + 1))
						}
						break

					case "backspace":
						if (cursorPosition > 0) {
							const newQuery =
								searchQuery.slice(0, cursorPosition - 1) +
								searchQuery.slice(cursorPosition)
							onSearchChange(newQuery)
							setCursorPosition(cursorPosition - 1)
						}
						break

					case "delete":
						if (cursorPosition < searchQuery.length) {
							const newQuery =
								searchQuery.slice(0, cursorPosition) +
								searchQuery.slice(cursorPosition + 1)
							onSearchChange(newQuery)
						}
						break

					case "left":
						setCursorPosition((prev) => Math.max(0, prev - 1))
						break

					case "right":
						setCursorPosition((prev) => Math.min(searchQuery.length, prev + 1))
						break

					case "home":
						setCursorPosition(0)
						break

					case "end":
						setCursorPosition(searchQuery.length)
						break

					case "c":
						if (key.ctrl) {
							onSearchChange("")
							setCursorPosition(0)
						}
						break

					default:
						// Handle printable characters
						if (key.sequence && key.sequence.length === 1) {
							const char = key.sequence
							// Only accept printable ASCII characters
							if (char.charCodeAt(0) >= 32 && char.charCodeAt(0) < 127) {
								const newQuery =
									searchQuery.slice(0, cursorPosition) +
									char +
									searchQuery.slice(cursorPosition)
								onSearchChange(newQuery)
								setCursorPosition(cursorPosition + 1)
							}
						}
						break
				}
			},
			[
				isOpen,
				searchQuery,
				cursorPosition,
				selectedCommand,
				maxIndex,
				onSearchChange,
				onSelectIndex,
				onExecute,
				onClose,
			],
		),
	)

	if (!isOpen) {
		return null
	}

	const dialogWidth = Math.min(70, width - 4)
	const left = Math.floor((width - dialogWidth) / 2)

	return (
		<box
			style={{
				position: "absolute",
				left,
				top: 10,
				width: dialogWidth,
				minHeight: 20,
				border: true,
				borderStyle: "rounded",
				flexDirection: "column",
				backgroundColor: t.bgSecondary,
				borderColor: t.border,
				zIndex: 200,
			}}
		>
			<box
				border={["bottom"]}
				style={{
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
					backgroundColor: t.bgTertiary,
					flexDirection: "row",
				}}
			>
				<text attributes={1}>Command Palette</text>
				<box style={{ flexGrow: 1 }} />
				<text fg={t.textTertiary}>
					{filteredCommands.length}/{commands.length} commands
				</text>
			</box>

			<box
				style={{
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
					flexDirection: "column",
				}}
			>
				<box style={{ flexDirection: "row", height: 1 }}>
					<text fg={t.textSecondary}>{"> "}</text>
					{searchQuery ? (
						<>
							<text fg={t.textPrimary}>
								{searchQuery.slice(0, cursorPosition)}
							</text>
							<box
								style={{
									backgroundColor: t.primary,
									width: 1,
									height: 1,
								}}
							>
								<text fg={t.selectedText}>
									{searchQuery[cursorPosition] || " "}
								</text>
							</box>
							<text fg={t.textPrimary}>
								{searchQuery.slice(cursorPosition + 1)}
							</text>
						</>
					) : (
						<text fg={t.textTertiary}>Type to search...</text>
					)}
				</box>

				<box style={{ height: 1 }} />

				<scrollbox>
					{filteredCommands.length === 0 ? (
						<text fg={t.textTertiary} attributes={2}>
							No commands match "{searchQuery}"
						</text>
					) : (
						filteredCommands.map((cmd, index) => {
							const isSelected = index === selectedIndex
							const bg = isSelected ? t.primary : undefined
							const fg = isSelected ? t.selectedText : t.textPrimary
							const shortcutFg = isSelected ? t.selectedText : t.textTertiary

							return (
								<box
									key={cmd.id}
									style={{
										height: 1,
										backgroundColor: bg,
										flexDirection: "row",
									}}
								>
									<text fg={fg}>{cmd.name}</text>
									<box style={{ flexGrow: 1 }} />
									{cmd.shortcut && <text fg={shortcutFg}>{cmd.shortcut}</text>}
								</box>
							)
						})
					)}
				</scrollbox>
			</box>

			<box
				border={["top"]}
				style={{
					paddingLeft: 1,
					paddingRight: 1,
					paddingTop: 1,
					paddingBottom: 1,
					backgroundColor: t.bgTertiary,
					flexDirection: "column",
				}}
			>
				{selectedCommand?.description ? (
					<text fg={t.textSecondary}>{selectedCommand.description}</text>
				) : (
					<box style={{ height: 1 }} />
				)}
				<box style={{ flexDirection: "row", marginTop: 1 }}>
					<text fg={t.textTertiary}>
						Enter to execute • Esc to close • ↑↓ or Tab to navigate
					</text>
				</box>
			</box>
		</box>
	)
}
