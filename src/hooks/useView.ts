import { useStore } from "@tanstack/react-store"
import { Store } from "@tanstack/store"

type ViewStore = {
	commandPallete: boolean
	logViewer: boolean
	terminalOutput: boolean
}

export const viewStore = new Store<ViewStore>({
	logViewer: false,
	commandPallete: false,
	terminalOutput: false,
})

const setter = (key: keyof ViewStore) => {
	return (value: boolean | ((prev: boolean) => boolean)) => {
		if (typeof value === "boolean") {
			viewStore.setState((s) => ({ ...s, [key]: value }))
		} else {
			viewStore.setState((s) => ({
				...s,
				[key]: value(s.logViewer),
			}))
		}
	}
}

export const useLogViewer = () => {
	const active = useStore(viewStore, (s) => s.logViewer)

	const setActive = setter("logViewer")

	return [active, setActive] as const
}

export const useCommandPallete = () => {
	const active = useStore(viewStore, (s) => s.commandPallete)

	const setActive = setter("commandPallete")

	return [active, setActive] as const
}

export const useTerminalOutput = () => {
	const active = useStore(viewStore, (s) => s.terminalOutput)
	const setActive = setter("terminalOutput")

	return [active, setActive] as const
}

export const useModalIsOpened = () => {
	return useStore(viewStore, (s) => s.logViewer || s.commandPallete)
}
