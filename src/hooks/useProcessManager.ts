import { useStore } from "@tanstack/react-store"
import { useMemo } from "react"
import { buildFlatList } from "../lib/monorepo"
import outputStore, { type OutputLine } from "../stores/outputStore"
import { processManagerStore } from "../stores/processManagerStore"

export const useProcess = (processId?: string) => {
	return useStore(processManagerStore, (s) =>
		processId ? s.processes.get(processId) : undefined,
	)
}

export const useOutput = ({
	processId,
	cb,
}: {
	processId: string
	cb: (line: OutputLine) => void
}) => {
	if (!processId) {
		return () => null
	}
	return outputStore.subscribeToOutput(processId, cb)
}

export const useProcessList = () => {
	const packages = useStore(processManagerStore, (s) => s.packages)
	const selectedIndex = useStore(processManagerStore, (s) => s.selectedIndex)

	// Build flat list
	const list = useMemo(() => buildFlatList(packages), [packages])

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
