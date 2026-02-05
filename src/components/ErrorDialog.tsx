import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useCallback } from "react"

interface ErrorDialogProps {
	isOpen: boolean
	error: Error | null
	scriptName: string
	packagePath: string
	onClose: () => void
}

export function ErrorDialog({
	isOpen,
	error,
	scriptName,
	packagePath,
	onClose,
}: ErrorDialogProps) {
	const { width, height } = useTerminalDimensions()

	useKeyboard(
		useCallback(
			(key) => {
				if (!isOpen) return

				switch (key.name) {
					case "return":
					case "escape":
						onClose()
						break
				}
			},
			[isOpen, onClose],
		),
	)

	if (!isOpen || !error) {
		return null
	}

	const dialogWidth = Math.min(70, width - 4)
	const dialogHeight = Math.min(15, height - 4)
	const left = Math.floor((width - dialogWidth) / 2)
	const top = Math.floor((height - dialogHeight) / 2)

	const errorMessage = error.message || "Unknown error"
	const errorStack = error.stack || ""
	const displayPath = packagePath || "root"

	return (
		<box
			style={{
				position: "absolute",
				left,
				top,
				width: dialogWidth,
				height: dialogHeight,
				border: true,
				borderStyle: "rounded",
				flexDirection: "column",
				padding: 1,
				backgroundColor: "#1e1e1e",
			}}
		>
			<text fg="#ef4444" attributes={1}>
				Failed to Start Script
			</text>
			<box style={{ height: 1 }} />
			<text fg="#94a3b8">
				Script: <text fg="#fbbf24">{scriptName}</text>
			</text>
			<text fg="#94a3b8">
				Package: <text fg="#fbbf24">{displayPath}</text>
			</text>
			<box style={{ height: 1 }} />
			<text fg="#ef4444" attributes={1}>
				Error:
			</text>
			<box style={{ flexDirection: "column", flexGrow: 1 }}>
				<text fg="#fca5a5">{errorMessage}</text>
			</box>
			{errorStack && (
				<>
					<box style={{ height: 1 }} />
					<text fg="#64748b" attributes={1}>
						Stack Trace:
					</text>
					<box style={{ flexDirection: "column", flexGrow: 1 }}>
						{errorStack
							.split("\n")
							.slice(0, 5)
							.map((line, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: its whatever, just an error box
								<text key={index} fg="#94a3b8">
									{line.length > dialogWidth - 4
										? `${line.substring(0, dialogWidth - 7)}...`
										: line}
								</text>
							))}
					</box>
				</>
			)}
			<box style={{ height: 1 }} />
			<text fg="#64748b">Press Enter or Escape to close</text>
		</box>
	)
}
