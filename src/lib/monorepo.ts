import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { load as yamlLoad } from "js-yaml"
import { log } from "../lib/logger"
import type {
	ListItem,
	PackageJson,
	ProcessManager,
	ScriptInfo,
	WorkspacePackage,
} from "../types"

interface PnpmWorkspaceConfig {
	packages?: string[]
}

export function detectWorkspaceType(
	cwd: string,
): "pnpm" | "npm" | "yarn" | "single" {
	// Check for pnpm-workspace.yaml
	if (
		existsSync(join(cwd, "pnpm-workspace.yaml")) ||
		existsSync(join(cwd, "pnpm-workspace.yml"))
	) {
		return "pnpm"
	}

	// Check for package.json with workspaces field
	const pkgJsonPath = join(cwd, "package.json")
	if (existsSync(pkgJsonPath)) {
		try {
			const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as PackageJson
			if (pkg.workspaces) {
				// Check for yarn vs npm by looking at lockfile
				if (existsSync(join(cwd, "yarn.lock"))) {
					return "yarn"
				}
				return "npm"
			}
		} catch {
			// Ignore parse errors
		}
	}

	return "single"
}

function parsePnpmWorkspace(cwd: string): string[] | null {
	const yamlPath = existsSync(join(cwd, "pnpm-workspace.yaml"))
		? join(cwd, "pnpm-workspace.yaml")
		: existsSync(join(cwd, "pnpm-workspace.yml"))
			? join(cwd, "pnpm-workspace.yml")
			: null

	if (!yamlPath) return null

	try {
		const content = readFileSync(yamlPath, "utf8")
		const config = yamlLoad(content) as PnpmWorkspaceConfig
		return config.packages || []
	} catch (error) {
		log.error(
			`Failed to parse pnpm-workspace.yaml: ${error instanceof Error ? error.message : error}`,
		)
		return null
	}
}

function parseNpmWorkspaces(cwd: string): string[] | null {
	const pkgJsonPath = join(cwd, "package.json")
	if (!existsSync(pkgJsonPath)) return null

	try {
		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as PackageJson
		if (!pkg.workspaces) return null

		// Handle both array and object formats
		if (Array.isArray(pkg.workspaces)) {
			return pkg.workspaces
		}
		if (pkg.workspaces.packages && Array.isArray(pkg.workspaces.packages)) {
			return pkg.workspaces.packages
		}

		return null
	} catch (error) {
		log.error(
			`Failed to parse package.json workspaces: ${error instanceof Error ? error.message : error}`,
		)
		return null
	}
}

async function expandGlobPatterns(
	cwd: string,
	patterns: string[],
): Promise<string[]> {
	const { Glob } = await import("bun")
	const packages: Set<string> = new Set()

	for (const pattern of patterns) {
		// Skip negations (exclusions)
		if (pattern.startsWith("!")) continue

		try {
			const glob = new Glob(pattern)

			// Scan for matching directories
			for await (const file of glob.scan({ cwd, onlyFiles: false })) {
				const fullPath = join(cwd, file)
				const pkgJsonPath = join(fullPath, "package.json")

				// Only include if package.json exists
				if (existsSync(pkgJsonPath)) {
					packages.add(file)
				}
			}
		} catch (error) {
			log.error(
				`Failed to expand glob pattern ${pattern}: ${error instanceof Error ? error.message : error}`,
			)
		}
	}

	return Array.from(packages)
}

function loadPackageScripts(packagePath: string): ScriptInfo[] {
	const pkgJsonPath = join(packagePath, "package.json")
	if (!existsSync(pkgJsonPath)) return []

	try {
		const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8")) as PackageJson
		if (!pkg.scripts) return []

		return Object.entries(pkg.scripts).map(([name, command]) => ({
			name,
			command,
		}))
	} catch (error) {
		log.error(
			`Failed to load scripts from ${pkgJsonPath}: ${error instanceof Error ? error.message : error}`,
		)
		return []
	}
}

export async function detectAndLoadWorkspace() {
	const cwd = process.cwd()
	log.info(`Detecting workspace type in ${cwd}`)
	const type = detectWorkspaceType(cwd)
	log.info(`Detected workspace type: ${type}`)

	let patterns: string[] | null = null

	if (type === "pnpm") {
		patterns = parsePnpmWorkspace(cwd)
	} else if (type === "npm" || type === "yarn") {
		patterns = parseNpmWorkspaces(cwd)
	}

	if (patterns) {
		log.info(`Found workspace patterns: ${patterns.join(", ")}`)
	}

	const packages: WorkspacePackage[] = []

	// Always load root package
	const rootScripts = loadPackageScripts(cwd)
	if (rootScripts.length > 0) {
		packages.push({
			path: "",
			fullPath: cwd,
			scripts: rootScripts,
			isRoot: true,
		})
		log.info(`Loaded root package with ${rootScripts.length} scripts`)
	}

	// Load workspace packages if found
	if (patterns && patterns.length > 0) {
		const packagePaths = await expandGlobPatterns(cwd, patterns)
		log.info(`Expanded to ${packagePaths.length} packages`)

		for (const pkgPath of packagePaths) {
			const fullPath = join(cwd, pkgPath)
			const scripts = loadPackageScripts(fullPath)

			// Only include packages with scripts
			if (scripts.length > 0) {
				packages.push({
					path: pkgPath,
					fullPath,
					scripts,
					isRoot: false,
				})
			}
		}

		// Sort non-root packages alphabetically
		const rootPkg = packages.filter((p) => p.isRoot)
		const otherPkgs = packages
			.filter((p) => !p.isRoot)
			.sort((a, b) => a.path.localeCompare(b.path))

		packages.length = 0
		packages.push(...rootPkg, ...otherPkgs)
	}

	// If workspace config exists but no packages found, fallback to single mode
	const finalType =
		patterns && packages.filter((p) => !p.isRoot).length > 0 ? type : "single"

	log.info(
		`Final workspace type: ${finalType} with ${packages.length} packages`,
	)

	return packages
}

export function buildFlatList(
	packages: WorkspacePackage[],
	processManager: ProcessManager,
): ListItem[] {
	const items: ListItem[] = []

	// Root package scripts (no header)
	const rootPkg = packages.find((p) => p.isRoot)
	if (rootPkg && rootPkg.scripts.length > 0) {
		rootPkg.scripts.forEach((script) => {
			items.push({
				type: "script",
				id: script.name, // No prefix for root
				packagePath: "",
				scriptName: script.name,
				command: script.command,
			})
		})
	}

	// Other packages (sorted alphabetically)
	const otherPackages = packages
		.filter((p) => !p.isRoot && p.scripts.length > 0)
		.sort((a, b) => a.path.localeCompare(b.path))

	otherPackages.forEach((pkg) => {
		// Add separator line (don't add before first item)
		if (items.length > 0) {
			items.push({
				type: "separator",
				id: `sep:${pkg.path}`,
			})
		}

		// Check if any script in this package is running
		const hasRunningScript = pkg.scripts.some((s) =>
			processManager.isRunning(`${pkg.path}/${s.name}`),
		)

		// Add header
		items.push({
			type: "header",
			id: `header:${pkg.path}`,
			packagePath: pkg.path,
			scriptCount: pkg.scripts.length,
			hasRunningScript,
		})

		// Add scripts if expanded
		pkg.scripts.forEach((script) => {
			items.push({
				type: "script",
				id: `${pkg.path}/${script.name}`,
				packagePath: pkg.path,
				scriptName: script.name,
				command: script.command,
			})
		})
	})

	return items
}
