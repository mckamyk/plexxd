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
