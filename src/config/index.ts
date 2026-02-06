import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import type { ThemeMode } from "./themes"

export const CONFIG_VERSION = "1.0.0"

export interface AppConfig {
	theme: ThemeMode
	version: string
}

const DEFAULT_CONFIG: AppConfig = {
	theme: "system",
	version: CONFIG_VERSION,
}

function getConfigPath(): string {
	const configDir = join(homedir(), ".config", "plexxd")
	return join(configDir, "config.json")
}

function ensureConfigDir(): void {
	const configDir = join(homedir(), ".config", "plexxd")
	if (!existsSync(configDir)) {
		mkdirSync(configDir, { recursive: true })
	}
}

export function loadConfig(): AppConfig {
	try {
		ensureConfigDir()
		const configPath = getConfigPath()

		if (!existsSync(configPath)) {
			return DEFAULT_CONFIG
		}

		const content = readFileSync(configPath, "utf8")
		const parsed = JSON.parse(content) as Partial<AppConfig>

		// Validate config
		if (parsed.theme && ["light", "dark", "system"].includes(parsed.theme)) {
			return {
				theme: parsed.theme,
				version: parsed.version || CONFIG_VERSION,
			}
		}
	} catch (error) {
		// Config load failed, use defaults
		console.error("Failed to load config:", error)
	}

	return DEFAULT_CONFIG
}

export function saveConfig(config: AppConfig): void {
	try {
		ensureConfigDir()
		const configPath = getConfigPath()
		writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8")
	} catch (error) {
		console.error("Failed to save config:", error)
	}
}
