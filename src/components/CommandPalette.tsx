import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useCallback, useMemo, useState } from "react"
import { commands, filterCommands } from "../config/commands"
import { useCommandPallete, useTheme } from "../stores"

export function CommandPalette() {
	const { width } = useTerminalDimensions()
	const { t } = useTheme()
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [isOpen, setIsOpen] = useCommandPallete()

	const filteredCommands = useMemo(() => {
		return filterCommands(searchQuery)
	}, [searchQuery])

	const selectedCommand = useMemo(() => {
		return filteredCommands[selectedIndex]
	}, [selectedIndex, filteredCommands])

	useKeyboard(
		useCallback(
			(key) => {
				if (!isOpen) {
					if (key.name === "p" && key.ctrl) {
						setIsOpen(true)
					}
					return
				}

				switch (key.name) {
					case "escape":
						if (searchQuery) {
							// Clear search first, then close on next escape
							setSearchQuery("")
						} else {
							setIsOpen(false)
						}
						break

					case "return":
						if (selectedCommand) {
							selectedCommand.execute()
							setIsOpen(false)
						}
						break

					case "up":
						setSelectedIndex((prev) => Math.max(0, prev - 1))
						break

					case "down":
						setSelectedIndex((prev) =>
							Math.min(filteredCommands.length - 1, prev + 1),
						)
						break

					case "tab":
						if (key.shift) {
							setSelectedIndex((prev) => Math.max(0, prev - 1))
						} else {
							setSelectedIndex((prev) =>
								Math.min(filteredCommands.length - 1, prev + 1),
							)
						}
						break

					case "c":
						if (key.ctrl) {
							setSearchQuery("")
						}
						break
				}
			},
			[
				isOpen,
				searchQuery,
				selectedCommand,
				setIsOpen,
				filteredCommands.length,
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
					<input focused placeholder="Search..." onInput={setSearchQuery} />
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
