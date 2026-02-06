import { useStore } from "@tanstack/react-store"
import { Store } from "@tanstack/store"

type ViewStore = {
	commandPallete: boolean
	logViewer: boolean
}

export const viewStore = new Store<ViewStore>({
	logViewer: false,
	commandPallete: false,
})

export const useLogViewer = () => {
	const active = useStore(viewStore, (s) => s.logViewer)

	const setActive = (active: boolean | ((prev: boolean) => boolean)) => {
		if (typeof active === "boolean") {
			viewStore.setState((s) => ({ ...s, logViewer: active }))
		} else {
			viewStore.setState((s) => ({
				...s,
				logViewer: active(s.logViewer),
			}))
		}
	}

	return [active, setActive] as const
}

export const useCommandPallete = () => {
	const active = useStore(viewStore, (s) => s.commandPallete)

	const setActive = (active: boolean | ((prev: boolean) => boolean)) => {
		if (typeof active === "boolean") {
			viewStore.setState((s) => ({ ...s, commandPallete: active }))
		} else {
			viewStore.setState((s) => ({
				...s,
				commandPallete: active(s.commandPallete),
			}))
		}
	}

	return [active, setActive] as const
}

export const useModalIsOpened = () => {
	return useStore(viewStore, (s) => s.logViewer || s.commandPallete)
}
