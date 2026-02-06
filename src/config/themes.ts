export type ThemeMode = "light" | "dark" | "system"

export interface Theme {
	// Backgrounds
	bgPrimary: string
	bgSecondary: string
	bgTertiary: string

	// Text
	textPrimary: string
	textSecondary: string
	textTertiary: string

	// Accents
	primary: string
	success: string
	error: string
	warning: string
	info: string

	// UI Elements
	border: string
	header: string
	selectedText: string
}

export const lightTheme: Theme = {
	// Backgrounds
	bgPrimary: "#ffffff",
	bgSecondary: "#f5f5f5",
	bgTertiary: "#e5e5e5",

	// Text
	textPrimary: "#0f0f0f",
	textSecondary: "#525252",
	textTertiary: "#737373",

	// Accents
	primary: "#2563eb",
	success: "#22c55e",
	error: "#ef4444",
	warning: "#f59e0b",
	info: "#3b82f6",

	// UI Elements
	border: "#d4d4d4",
	header: "#000000",
	selectedText: "#ffffff",
}

export const darkTheme: Theme = {
	// Backgrounds
	bgPrimary: "#0a0a0a",
	bgSecondary: "#1a1a1a",
	bgTertiary: "#2a2a2a",

	// Text
	textPrimary: "#e2e8f0",
	textSecondary: "#94a3b8",
	textTertiary: "#666666",

	// Accents
	primary: "#2563eb",
	success: "#22c55e",
	error: "#ef4444",
	warning: "#f59e0b",
	info: "#3b82f6",

	// UI Elements
	border: "#64748b",
	header: "#FFFF00",
	selectedText: "#ffffff",
}

export function getResolvedTheme(mode: ThemeMode): Theme {
	if (mode === "light") return lightTheme
	if (mode === "dark") return darkTheme

	// System detection
	const isDark = detectSystemDarkMode()
	return isDark ? darkTheme : lightTheme
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
