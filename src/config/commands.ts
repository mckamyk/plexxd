import type { Command } from "../types"
import { configStore } from "./store"

export interface CommandContext {
	toggleTheme: () => void
	openLogViewer: () => void
	killAllProcesses: () => void
	exit: () => void
	closePalette: () => void
}

export function createCommands(context: CommandContext): Command[] {
	return [
		{
			id: "toggle-theme",
			name: "Toggle Theme",
			shortcut: "Alt+T",
			description: "Switch between light, dark, and system themes",
			execute: () => {
				context.toggleTheme()
				context.closePalette()
			},
		},
		{
			id: "set-light-theme",
			name: "Set Light Theme",
			description: "Switch to light color theme",
			execute: () => {
				if (configStore.state.theme !== "light") {
					context.toggleTheme()
				}
				context.closePalette()
			},
		},
		{
			id: "set-dark-theme",
			name: "Set Dark Theme",
			description: "Switch to dark color theme",
			execute: () => {
				if (configStore.state.theme !== "dark") {
					context.toggleTheme()
				}
				context.closePalette()
			},
		},
		{
			id: "open-logs",
			name: "Open Log Viewer",
			shortcut: "F12",
			description: "View application logs",
			execute: () => {
				context.openLogViewer()
				context.closePalette()
			},
		},
		{
			id: "kill-all",
			name: "Kill All Processes",
			description: "Stop all running scripts",
			execute: () => {
				context.killAllProcesses()
				context.closePalette()
			},
		},
		{
			id: "exit",
			name: "Exit Application",
			shortcut: "Q",
			description: "Quit plexxd",
			execute: () => {
				context.exit()
			},
		},
		{
			id: "quit",
			name: "Quit",
			shortcut: "Ctrl+C",
			description: "Quit plexxd (alternative)",
			execute: () => {
				context.exit()
			},
		},
	]
}

export function filterCommands(
	commands: Command[],
	query: string,
	maxResults = 10,
): Command[] {
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
