import { useKeyboard } from "@opentui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMonorepo } from "../hooks/useMonorepo";
import { useProcessManager } from "../hooks/useProcessManager";
import type { ListItem, ProcessId, WorkspaceInfo } from "../types";
import { ScriptList } from "./ScriptList";
import { TerminalOutput } from "./TerminalOutput";

function buildFlatList(
	workspace: WorkspaceInfo,
	collapsed: Set<string>,
	processManager: ReturnType<typeof useProcessManager>,
): ListItem[] {
	const items: ListItem[] = [];

	// Root package scripts (no header)
	const rootPkg = workspace.packages.find((p) => p.isRoot);
	if (rootPkg && rootPkg.scripts.length > 0) {
		rootPkg.scripts.forEach((script) => {
			items.push({
				type: "script",
				id: script.name, // No prefix for root
				packagePath: "",
				scriptName: script.name,
				command: script.command,
			});
		});
	}

	// Other packages (sorted alphabetically)
	const otherPackages = workspace.packages
		.filter((p) => !p.isRoot && p.scripts.length > 0)
		.sort((a, b) => a.path.localeCompare(b.path));

	otherPackages.forEach((pkg) => {
		// Add separator line (don't add before first item)
		if (items.length > 0) {
			items.push({
				type: "separator",
				id: `sep:${pkg.path}`,
			});
		}

		// Check if any script in this package is running
		const hasRunningScript = pkg.scripts.some((s) =>
			processManager.isRunning(`${pkg.path}/${s.name}`),
		);

		// Add header
		items.push({
			type: "header",
			id: `header:${pkg.path}`,
			packagePath: pkg.path,
			collapsed: collapsed.has(pkg.path),
			scriptCount: pkg.scripts.length,
			hasRunningScript,
		});

		// Add scripts if expanded
		if (!collapsed.has(pkg.path)) {
			pkg.scripts.forEach((script) => {
				items.push({
					type: "script",
					id: `${pkg.path}/${script.name}`,
					packagePath: pkg.path,
					scriptName: script.name,
					command: script.command,
				});
			});
		}
	});

	return items;
}

export function App() {
	const workspaceInfo = useMonorepo();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [collapsedPackages, setCollapsedPackages] = useState<Set<string>>(
		new Set(),
	);
	const [selectedProcessId, setSelectedProcessId] = useState<ProcessId>("");
	const [output, setOutput] = useState<string[]>([]);
	const processManager = useProcessManager();

	// Build flat list
	const flatList = useMemo(
		() => buildFlatList(workspaceInfo, collapsedPackages, processManager),
		[workspaceInfo, collapsedPackages, processManager.processes],
	);

	// Subscribe to output changes for the selected process
	useEffect(() => {
		if (!selectedProcessId) return;

		setOutput(processManager.getOutput(selectedProcessId));

		const unsubscribe = processManager.onOutput(selectedProcessId, (line) => {
			setOutput((prev) => [...prev.slice(-999), line]);
		});

		return unsubscribe;
	}, [selectedProcessId, processManager]);

	// Update selected process ID when navigating
	useEffect(() => {
		const currentItem = flatList[selectedIndex];
		if (currentItem?.type === "script") {
			setSelectedProcessId(currentItem.id);
		}
	}, [selectedIndex, flatList]);

	useKeyboard(
		useCallback(
			(key) => {
				if (flatList.length === 0) return;

				const currentItem = flatList[selectedIndex];

				switch (key.name) {
					case "up":
					case "k":
						setSelectedIndex((prev) => {
							let newIndex = prev > 0 ? prev - 1 : flatList.length - 1;
							// Skip separators
							while (flatList[newIndex]?.type === "separator") {
								newIndex = newIndex > 0 ? newIndex - 1 : flatList.length - 1;
								if (newIndex === prev) break; // Avoid infinite loop
							}
							return newIndex;
						});
						break;

					case "down":
					case "j":
						setSelectedIndex((prev) => {
							let newIndex = prev < flatList.length - 1 ? prev + 1 : 0;
							// Skip separators
							while (flatList[newIndex]?.type === "separator") {
								newIndex = newIndex < flatList.length - 1 ? newIndex + 1 : 0;
								if (newIndex === prev) break;
							}
							return newIndex;
						});
						break;

					case "return":
						if (currentItem.type === "header") {
							// Toggle collapse
							setCollapsedPackages((prev) => {
								const next = new Set(prev);
								if (next.has(currentItem.packagePath!)) {
									next.delete(currentItem.packagePath!);
								} else {
									next.add(currentItem.packagePath!);
								}
								return next;
							});
						} else if (currentItem.type === "script") {
							const processId = currentItem.id;
							if (processManager.isRunning(processId)) {
								processManager.kill(processId);
							} else {
								processManager.spawn(
									processId,
									currentItem.packagePath!,
									currentItem.scriptName!,
									currentItem.command!,
								);
								setSelectedProcessId(processId);
							}
						}
						break;

					case "x":
						if (currentItem.type === "script") {
							processManager.kill(currentItem.id);
						}
						break;

					case "q":
					case "escape":
						processManager.killAll();
						process.exit(0);
						break;
				}
			},
			[flatList, selectedIndex, processManager, collapsedPackages],
		),
	);

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
				<text fg="#ef4444" attributes={1}>
					No package.json found or no scripts defined
				</text>
				<box style={{ height: 1 }} />
				<text fg="#888888">Press q to exit</text>
			</box>
		);
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
		</box>
	);
}
