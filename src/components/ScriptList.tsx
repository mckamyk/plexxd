import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useMemo } from "react"
import { useProcess, useProcessList } from "../hooks/useProcessManager"
import { useModalIsOpened } from "../hooks/useView"
import { log } from "../lib/logger"
import {
	killAllProcesses,
	killProcess,
	processManagerStore,
	spawnProcess,
} from "../stores/processManagerStore"
import { useTheme } from "../stores/themeStore"

export function ScriptList() {
	const { width } = useTerminalDimensions()
	const { t } = useTheme()
	const { list, selected, moveUp, moveDown } = useProcessList()
	const isModalOpened = useModalIsOpened()

	useKeyboard((key) => {
		if (list.length === 0) return
		if (isModalOpened) return
		const proc =
			selected && processManagerStore.state.processes.get(selected.id)

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
						killProcess(proc.processId)
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

	if (list.length === 0) {
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
			{list.map((item) => (
				<ListItem key={item.id} id={item.id} />
			))}
		</box>
	)
}

const ListItem = ({ id }: { id: string }) => {
	const { list, selected } = useProcessList()
	const { t } = useTheme()

	const item = useMemo(() => {
		return list.find((i) => i.id === id)
	}, [list, id])

	const isSelected = item === selected
	const proc = useProcess(id)

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
	const fg = isSelected ? t.selectedText : running ? t.success : t.textSecondary
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
}
