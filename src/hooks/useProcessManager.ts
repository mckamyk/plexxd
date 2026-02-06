import { useStore } from "@tanstack/react-store"
import { useCallback, useMemo } from "react"
import { buildFlatList } from "../lib/monorepo"
import {
	getProcessOutput,
	isProcessRunning,
	killAllProcesses,
	killProcess,
	onProcessOutput,
	processManagerStore,
	spawnProcess,
} from "../stores/processManagerStore"
import type { ProcessId, ProcessManager, SpawnResult } from "../types"

export function useProcessManager(): ProcessManager {
	// Subscribe to store changes
	const processes = useStore(processManagerStore, (s) => s.processes)
	const workspaceType = useStore(processManagerStore, (s) => s.workspaceType)

	// Keep same API surface
	const spawn = useCallback(
		(
			processId: ProcessId,
			packagePath: string,
			scriptName: string,
		): SpawnResult => {
			return spawnProcess(processId, packagePath, scriptName, workspaceType)
		},
		[workspaceType],
	)

	const kill = useCallback((processId: ProcessId): boolean => {
		return killProcess(processId)
	}, [])

	const killAll = useCallback(() => {
		killAllProcesses()
	}, [])

	const getOutput = useCallback((processId: ProcessId): string[] => {
		return getProcessOutput(processId)
	}, [])

	const isRunning = useCallback((processId: ProcessId): boolean => {
		return isProcessRunning(processId)
	}, [])

	const onOutput = useCallback(
		(processId: ProcessId, callback: (line: string) => void): (() => void) => {
			return onProcessOutput(processId, callback)
		},
		[],
	)

	return {
		processes,
		spawn,
		kill,
		killAll,
		getOutput,
		isRunning,
		onOutput,
	}
}

export const useProcess = (processId?: string) => {
	return useStore(processManagerStore, (s) =>
		processId ? s.processes.get(processId) : undefined,
	)
}

export const useProcessList = () => {
	const packages = useStore(processManagerStore, (s) => s.packages)
	const processManager = useProcessManager()
	const selectedIndex = useStore(processManagerStore, (s) => s.selectedIndex)

	// Build flat list
	const list = useMemo(
		() => buildFlatList(packages, processManager),
		[packages, processManager],
	)

	const selected = useMemo(() => list.at(selectedIndex), [selectedIndex, list])

	const moveUp = () => {
		const newIndex = Math.max(0, selectedIndex - 1)
		const selectedId = list.at(newIndex)?.id
		processManagerStore.setState((s) => ({
			...s,
			selectedIndex: newIndex,
			selectedId,
		}))
	}

	const moveDown = () => {
		const newIndex = Math.min(list.length - 1, selectedIndex + 1)
		const selectedId = list.at(newIndex)?.id
		processManagerStore.setState((s) => ({
			...s,
			selectedIndex: newIndex,
			selectedId,
		}))
	}

	return { selected, list, moveUp, moveDown }
}
