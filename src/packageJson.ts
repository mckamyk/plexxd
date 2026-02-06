import { log } from "./lib/logger"
import type { ScriptInfo } from "./types"

export function readPackageJson(): ScriptInfo[] {
	try {
		const pkg = require(`${process.cwd()}/package.json`) as {
			scripts?: Record<string, string>
		}
		if (pkg.scripts) {
			const scripts = Object.entries(pkg.scripts).map(([name, command]) => ({
				name,
				command,
			}))
			log.info(`Loaded ${scripts.length} scripts from package.json`)
			return scripts
		}
	} catch (error) {
		log.error(
			`Failed to read package.json: ${error instanceof Error ? error.message : error}`,
		)
	}
	return []
}
