import { useKeyboard } from "@opentui/react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createCommands } from "../config/commands"
import { useConfig } from "../hooks/useConfig"
import { useMonorepo } from "../hooks/useMonorepo"
import { useProcessManager } from "../hooks/useProcessManager"
import { log } from "../lib/logger"
import type {
	Command,
	ErrorDialogState,
	ListItem,
	ProcessId,
	WorkspaceInfo,
} from "../types"
import { CommandPalette } from "./CommandPalette"
import { ErrorDialog } from "./ErrorDialog"
import { LogViewer } from "./LogViewer"
import { ScriptList } from "./ScriptList"
import { TerminalOutput } from "./TerminalOutput"

function buildFlatList(
	workspace: WorkspaceInfo,
	collapsed: Set<string>,
	processManager: ReturnType<typeof useProcessManager>,
): ListItem[] {
	const items: ListItem[] = []

	// Root package scripts (no header)
	const rootPkg = workspace.packages.find((p) => p.isRoot)
	if (rootPkg && rootPkg.scripts.length > 0) {
		rootPkg.scripts.forEach((script) => {
			items.push({
				type: "script",
				id: script.name, // No prefix for root
				packagePath: "",
				scriptName: script.name,
				command: script.command,
			})
		})
	}

	// Other packages (sorted alphabetically)
	const otherPackages = workspace.packages
		.filter((p) => !p.isRoot && p.scripts.length > 0)
		.sort((a, b) => a.path.localeCompare(b.path))

	otherPackages.forEach((pkg) => {
		// Add separator line (don't add before first item)
		if (items.length > 0) {
			items.push({
				type: "separator",
				id: `sep:${pkg.path}`,
			})
		}

		// Check if any script in this package is running
		const hasRunningScript = pkg.scripts.some((s) =>
			processManager.isRunning(`${pkg.path}/${s.name}`),
		)

		// Add header
		items.push({
			type: "header",
			id: `header:${pkg.path}`,
			packagePath: pkg.path,
			collapsed: collapsed.has(pkg.path),
			scriptCount: pkg.scripts.length,
			hasRunningScript,
		})

		// Add scripts if expanded
		if (!collapsed.has(pkg.path)) {
			pkg.scripts.forEach((script) => {
				items.push({
					type: "script",
					id: `${pkg.path}/${script.name}`,
					packagePath: pkg.path,
					scriptName: script.name,
					command: script.command,
				})
			})
		}
	})

	return items
}

export function App() {
	const workspaceInfo = useMonorepo()
	const { currentTheme: t, toggleTheme } = useConfig()
	const [selectedIndex, setSelectedIndex] = useState(0)
	const [collapsedPackages, setCollapsedPackages] = useState<Set<string>>(
		new Set(),
	)
	const [selectedProcessId, setSelectedProcessId] = useState<ProcessId>("")
	const [output, setOutput] = useState<string[]>([])
	const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
		isOpen: false,
		error: null,
		scriptName: "",
		packagePath: "",
	})
	const [showLogViewer, setShowLogViewer] = useState(false)
	const [showCommandPalette, setShowCommandPalette] = useState(false)
	const [commandSearch, setCommandSearch] = useState("")
	const [commandIndex, setCommandIndex] = useState(0)
	const processManager = useProcessManager()

	// Build flat list
	const flatList = useMemo(
		() => buildFlatList(workspaceInfo, collapsedPackages, processManager),
		[workspaceInfo, collapsedPackages, processManager],
	)

	// Subscribe to output changes for the selected process
	useEffect(() => {
		if (!selectedProcessId) return

		setOutput(processManager.getOutput(selectedProcessId))

		const unsubscribe = processManager.onOutput(selectedProcessId, (line) => {
			setOutput((prev) => [...prev.slice(-999), line])
		})

		return unsubscribe
	}, [selectedProcessId, processManager])

	// Update selected process ID when navigating
	useEffect(() => {
		const currentItem = flatList[selectedIndex]
		if (currentItem?.type === "script") {
			setSelectedProcessId(currentItem.id)
		}
	}, [selectedIndex, flatList])

	useKeyboard(
		useCallback(
			(key) => {
				if (flatList.length === 0) return

				const currentItem = flatList[selectedIndex]

				switch (key.name) {
					case "p":
						if (key.ctrl) {
							setShowCommandPalette((prev) => !prev)
							if (!showCommandPalette) {
								setCommandSearch("")
								setCommandIndex(0)
							}
						}
						break

					case "f12":
						if (showCommandPalette) break
						setShowLogViewer((prev) => !prev)
						break

					case "up":
					case "k":
						if (showLogViewer || showCommandPalette) break
						setSelectedIndex((prev) => {
							let newIndex = prev > 0 ? prev - 1 : flatList.length - 1
							// Skip separators
							while (flatList[newIndex]?.type === "separator") {
								newIndex = newIndex > 0 ? newIndex - 1 : flatList.length - 1
								if (newIndex === prev) break // Avoid infinite loop
							}
							return newIndex
						})
						break

					case "down":
					case "j":
						if (showLogViewer || showCommandPalette) break
						setSelectedIndex((prev) => {
							let newIndex = prev < flatList.length - 1 ? prev + 1 : 0
							// Skip separators
							while (flatList[newIndex]?.type === "separator") {
								newIndex = newIndex < flatList.length - 1 ? newIndex + 1 : 0
								if (newIndex === prev) break
							}
							return newIndex
						})
						break

					case "return":
						log.info(
							`showLogViewer: ${showLogViewer} type: ${currentItem.type} `,
						)
						if (showLogViewer || showCommandPalette) break
						if (currentItem.type === "header") {
							// Toggle collapse
							setCollapsedPackages((prev) => {
								if (currentItem.packagePath === undefined) return prev
								const next = new Set(prev)
								const path = currentItem.packagePath || "root"
								if (next.has(path)) {
									next.delete(path)
								} else {
									next.add(path)
								}
								return next
							})
						} else if (currentItem.type === "script") {
							const processId = currentItem.id
							log.info(`isRunning: ${processManager.isRunning(processId)}`)
							if (processManager.isRunning(processId)) {
								processManager.kill(processId)
							} else {
								log.info(
									`spawn ${currentItem.packagePath} ${currentItem.scriptName}`,
								)
								if (
									currentItem.packagePath === undefined ||
									!currentItem.scriptName
								)
									return
								const result = processManager.spawn(
									processId,
									currentItem.packagePath,
									currentItem.scriptName,
									workspaceInfo.type,
								)
								log.info(`spawn result: ${JSON.stringify(result)}`)
								if (result.success) {
									setSelectedProcessId(processId)
								} else if (result.error) {
									setErrorDialog({
										isOpen: true,
										error: result.error,
										scriptName: currentItem.scriptName,
										packagePath: currentItem.packagePath || "root",
									})
								}
							}
						}
						break

					case "x":
						if (showLogViewer || showCommandPalette) break
						if (currentItem.type === "script") {
							processManager.kill(currentItem.id)
						}
						break

					case "q":
					case "escape":
						if (showCommandPalette) break
						if (showLogViewer) {
							setShowLogViewer(false)
							break
						}
						processManager.killAll()
						process.exit(0)
				}
			},
			[
				flatList,
				selectedIndex,
				processManager,
				workspaceInfo.type,
				showLogViewer,
				showCommandPalette,
			],
		),
	)

	const closeErrorDialog = useCallback(() => {
		setErrorDialog((prev) => ({ ...prev, isOpen: false }))
	}, [])

	const closeLogViewer = useCallback(() => {
		setShowLogViewer(false)
	}, [])

	const closeCommandPalette = useCallback(() => {
		setShowCommandPalette(false)
		setCommandSearch("")
		setCommandIndex(0)
	}, [])

	// Create commands with context
	const commands = useMemo<Command[]>(
		() =>
			createCommands({
				toggleTheme,
				openLogViewer: () => setShowLogViewer(true),
				killAllProcesses: () => processManager.killAll(),
				exit: () => {
					processManager.killAll()
					process.exit(0)
				},
				closePalette: closeCommandPalette,
			}),
		[toggleTheme, processManager, closeCommandPalette],
	)

	if (flatList.length === 0) {
		return (
			<box
				style={{
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: "100%",
				}}
			>
				<text fg={t.error} attributes={1}>
					No package.json found or no scripts defined
				</text>
				<box style={{ height: 1 }} />
				<text fg={t.textTertiary}>Press q to exit</text>
			</box>
		)
	}

	return (
		<box
			style={{
				flexDirection: "row",
				width: "100%",
				height: "100%",
				padding: 1,
			}}
		>
			<ScriptList
				items={flatList}
				selectedIndex={selectedIndex}
				isRunning={processManager.isRunning}
			/>
			<box style={{ width: 1 }} />
			<TerminalOutput processId={selectedProcessId} output={output} />
			<ErrorDialog
				isOpen={errorDialog.isOpen}
				error={errorDialog.error}
				scriptName={errorDialog.scriptName}
				packagePath={errorDialog.packagePath}
				onClose={closeErrorDialog}
			/>
			{showLogViewer && <LogViewer onClose={closeLogViewer} />}
			<CommandPalette
				commands={commands}
				isOpen={showCommandPalette}
				searchQuery={commandSearch}
				selectedIndex={commandIndex}
				onSearchChange={setCommandSearch}
				onSelectIndex={setCommandIndex}
				onExecute={(cmd) => cmd.execute()}
				onClose={closeCommandPalette}
			/>
		</box>
	)
}
