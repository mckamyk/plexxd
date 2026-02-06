import { useStore } from "@tanstack/react-store"
import { appStore, scripts } from "../stores"
import outputStore, { type OutputLine } from "../stores/outputStore"

export const useProcess = (processId?: string) => {
	return useStore(appStore, (s) =>
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
		appStore,
		(s) => scripts.find((i) => i.id === s.selectedId) ?? scripts[0],
	)
	const setSelected = (id: string) =>
		appStore.setState((s) => ({
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
