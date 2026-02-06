import { useStore } from "@tanstack/react-store"
import outputStore, { type OutputLine } from "../stores/outputStore"
import { processManagerStore, scripts } from "../stores/processManagerStore"

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
	const selected = useStore(
		processManagerStore,
		(s) => scripts.find((i) => i.id === s.selectedId) ?? scripts[0],
	)
	const setSelected = (id: string) =>
		processManagerStore.setState((s) => ({
			...s,
			selectedId: id,
		}))

	const moveUp = () => {
		const index = scripts.findIndex((i) => i.id === selected?.id) ?? 0
		const newIndex = Math.max(0, index - 1)
		setSelected(scripts[newIndex].id)
	}

	const moveDown = () => {
		const index = scripts.findIndex((i) => i.id === selected?.id) ?? 0
		const newIndex = Math.min(scripts.length - 1, index + 1)
		setSelected(scripts[newIndex].id)
	}

	return { selected, setSelected, moveUp, moveDown }
}
