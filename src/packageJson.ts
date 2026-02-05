import type { ScriptInfo } from "./types"

export function readPackageJson(): ScriptInfo[] {
	try {
		const pkg = require(`${process.cwd()}/package.json`) as {
			scripts?: Record<string, string>
		}
		if (pkg.scripts) {
			return Object.entries(pkg.scripts).map(([name, command]) => ({
				name,
				command,
			}))
		}
	} catch (error) {
		console.error("Failed to read package.json:", error)
	}
	return []
}
