import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useProcess, useProcessList } from "../hooks/useProcessManager"
import { log } from "../lib/logger"
import {
	appStore,
	killAllProcesses,
	killProcess,
	scripts,
	spawnProcess,
	useModalIsOpened,
	useTerminalOutput,
	useTheme,
} from "../stores"
import type { ListItem } from "../types"
import { Keybinds } from "./Keybinds"

export function ScriptList() {
	const { width } = useTerminalDimensions()
	const { t } = useTheme()
	const { selected, moveUp, moveDown } = useProcessList()

	const isModalOpened = useModalIsOpened()
	const [terminalFocused, setTerminalFocused] = useTerminalOutput()
	const focused = !isModalOpened && !terminalFocused

	useKeyboard((key) => {
		if (!focused) return
		if (scripts.length === 0) return
		if (isModalOpened) return
		const proc = selected && appStore.state.processes.get(selected.id)

		switch (key.name) {
			case "up":
			case "k":
				moveUp()
				break

			case "down":
			case "j":
				moveDown()
				break

			case "return":
				if (!selected) return
				if (selected.type === "script") {
					const processId = selected.id
					log.info(`isRunning: ${proc?.isRunning ?? false}`)
					if (proc?.isRunning) {
						setTerminalFocused(true)
					} else {
						log.info(`spawn ${selected.packagePath} ${selected.scriptName}`)
						if (selected.packagePath === undefined || !selected.scriptName)
							return
						const result = spawnProcess(
							processId,
							selected.packagePath,
							selected.scriptName,
						)
						log.info(`spawn result: ${JSON.stringify(result)}`)
						if (result.error) {
							log.error(
								`Failed to spawn: ${result.error.name}: ${result.error.message}`,
							)
						}
					}
				}
				break

			case "x":
				if (selected?.type === "script") {
					killProcess(selected.id)
				}
				break

			case "q":
			case "escape":
				killAllProcesses()
				process.exit(0)
		}
	})

	if (scripts.length === 0) {
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
				borderColor: focused ? t.success : t.border,
			}}
		>
			<text fg={t.header} attributes={1}>
				Scripts
			</text>
			<box style={{ height: 1 }} />
			{scripts.map((item) => (
				<ListRow key={item.id} item={item} />
			))}
			<box style={{ flexGrow: 2 }} />
			<Keybinds />
		</box>
	)
}

const ListRow = ({ item }: { item: ListItem }) => {
	const { selected } = useProcessList()
	const { t } = useTheme()

	const isSelected = item === selected
	const proc = useProcess(item.id)

	if (!item) return null

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
					paddingLeft: 1,
				}}
			>
				<text fg={isSelected ? t.selectedText : t.header}>
					{item.packagePath}
				</text>
			</box>
		)
	}

	// Script item
	const running = !!proc?.isRunning
	const bg = isSelected ? t.primary : undefined
	const fg = running ? t.success : isSelected ? t.selectedText : t.textPrimary
	const prefix = item.packagePath ? "  " : "" // Indent package scripts

	return (
		<box
			key={item.id}
			style={{
				height: 1,
				backgroundColor: bg,
				flexDirection: "row",
				paddingLeft: 1,
			}}
		>
			<text fg={fg}>
				{prefix}
				{running ? "● " : "○ "}
				{item.scriptName}
			</text>
		</box>
	)
}
