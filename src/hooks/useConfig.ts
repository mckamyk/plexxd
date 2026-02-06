import { useCallback, useSyncExternalStore } from "react"
import {
	type ConfigState,
	configStore,
	setTheme as storeSetTheme,
	toggleTheme as storeToggleTheme,
} from "../config/store"
import {
	darkTheme,
	lightTheme,
	type Theme,
	type ThemeMode,
} from "../config/themes"
import { log } from "../lib/logger"

interface UseConfigReturn {
	config: ConfigState
	currentTheme: Theme
	isSystemTheme: boolean
	setTheme: (theme: ThemeMode) => void
	toggleTheme: () => void
}

function useStore<T>(store: {
	subscribe: (callback: () => void) => () => void
	state: T
}): T {
	return useSyncExternalStore(
		(callback) => store.subscribe(callback),
		() => store.state,
		() => store.state,
	)
}

export function useConfig(): UseConfigReturn {
	const config = useStore(configStore)

	const currentTheme = config._resolvedTheme === "dark" ? darkTheme : lightTheme
	const isSystemTheme = config.theme === "system"

	const setTheme = useCallback((theme: ThemeMode) => {
		storeSetTheme(theme)
		log.info(`Theme changed to: ${theme}`)
	}, [])

	const toggleTheme = useCallback(() => {
		storeToggleTheme()
		const nextMode = configStore.state.theme
		log.info(`Theme toggled to: ${nextMode}`)
	}, [])

	return {
		config,
		currentTheme,
		isSystemTheme,
		setTheme,
		toggleTheme,
	}
}
