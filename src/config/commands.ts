import { appStore, killAllProcesses, viewStore } from "../stores"
import type { Command } from "../types"

export const commands: Command[] = [
	{
		id: "toggle-theme",
		name: "Toggle Theme",
		shortcut: "Alt+T",
		description: "Switch between light, dark, and system themes",
		execute: () => {
			const modes = ["system", "light", "dark"] as const
			const current = appStore.state.themeSetting
			const index = modes.indexOf(current)
			const next = modes[index + 1] ?? modes[0]
			appStore.setState((s) => ({ ...s, themeSetting: next }))
		},
	},
	{
		id: "set-light-theme",
		name: "Set Light Theme",
		description: "Switch to light color theme",
		execute: () => {
			appStore.setState((s) => ({ ...s, themeSetting: "light" }))
		},
	},
	{
		id: "set-dark-theme",
		name: "Set Dark Theme",
		description: "Switch to dark color theme",
		execute: () => {
			appStore.setState((s) => ({ ...s, themeSetting: "dark" }))
		},
	},
	{
		id: "open-logs",
		name: "Open Log Viewer",
		shortcut: "F12",
		description: "View application logs",
		execute: () => {
			viewStore.setState((s) => ({ ...s, logViewer: !s.logViewer }))
		},
	},
	{
		id: "kill-all",
		name: "Kill All Processes",
		description: "Stop all running scripts",
		execute: () => {
			killAllProcesses()
		},
	},
	{
		id: "exit",
		name: "Exit Application",
		shortcut: "Q",
		description: "Quit plexxd",
		execute: () => {
			killAllProcesses()
			process.exit()
		},
	},
]

export function filterCommands(query: string, maxResults = 10): Command[] {
	if (!query.trim()) {
		return commands.slice(0, maxResults)
	}

	const lowerQuery = query.toLowerCase()

	return commands
		.filter(
			(cmd) =>
				cmd.name.toLowerCase().includes(lowerQuery) ||
				cmd.id.toLowerCase().includes(lowerQuery) ||
				cmd.description?.toLowerCase().includes(lowerQuery),
		)
		.slice(0, maxResults)
}
