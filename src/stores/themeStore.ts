import { useStore } from "@tanstack/react-store"
import { Store } from "@tanstack/store"
import { darkTheme, lightTheme, type ThemeMode } from "../config/themes"

export const themeStore = new Store<"dark" | "light" | "system">("system")

export const useTheme = () => {
	const setting = useStore(themeStore)
	const theme = getResolvedTheme(setting)

	const setTheme = (theme: "dark" | "light" | "system") => {
		themeStore.setState(theme)
	}

	const t = theme === "light" ? lightTheme : darkTheme

	return { setting, theme, setTheme, t }
}

function getResolvedTheme(theme: ThemeMode): "light" | "dark" {
	if (theme === "light") return "light"
	if (theme === "dark") return "dark"

	// System detection
	const isDark = detectSystemDarkMode()
	return isDark ? "dark" : "light"
}

function detectSystemDarkMode(): boolean {
	// Check environment variables
	const colorterm = process.env.COLORTERM?.toLowerCase()
	const termProgram = process.env.TERM_PROGRAM?.toLowerCase()

	// Check for known dark terminal indicators
	if (colorterm?.includes("truecolor") || colorterm?.includes("24bit")) {
		// Try to detect based on terminal color scheme hints
		// Many terminals set hints in environment
	}

	// Check terminal-specific hints
	if (process.env.THEME?.toLowerCase() === "dark") return true
	if (process.env.THEME?.toLowerCase() === "light") return false

	// Check for macOS terminal
	if (termProgram === "apple_terminal") {
		// macOS Terminal.app - default is light
		return false
	}

	// Check for iTerm2
	if (termProgram === "iterm2") {
		// iTerm2 often has COLORFGBG set
		const colorFGBG = process.env.COLORFGBG
		if (colorFGBG) {
			// Format is usually "fg;bg" in 0-15 color space
			// 0-6 are dark colors, 7-15 are light
			const parts = colorFGBG.split(";")
			if (parts.length >= 2) {
				const bg = parseInt(parts[1], 10)
				// 0-6 = dark background, 7-15 = light background
				return bg <= 6
			}
		}
	}

	// Default to light as requested
	return false
}
