import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useCallback } from "react"
import { useConfig } from "../hooks/useConfig"

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
	const { currentTheme: t } = useConfig()

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
				backgroundColor: t.bgSecondary,
				borderColor: t.border,
			}}
		>
			<text fg={t.error} attributes={1}>
				Failed to Start Script
			</text>
			<box style={{ height: 1 }} />
			<text fg={t.textSecondary}>
				Script: <text fg={t.warning}>{scriptName}</text>
			</text>
			<text fg={t.textSecondary}>
				Package: <text fg={t.warning}>{displayPath}</text>
			</text>
			<box style={{ height: 1 }} />
			<text fg={t.error} attributes={1}>
				Error:
			</text>
			<box style={{ flexDirection: "column", flexGrow: 1 }}>
				<text fg={t.error}>{errorMessage}</text>
			</box>
			{errorStack && (
				<>
					<box style={{ height: 1 }} />
					<text fg={t.textSecondary} attributes={1}>
						Stack Trace:
					</text>
					<box style={{ flexDirection: "column", flexGrow: 1 }}>
						{errorStack
							.split("\n")
							.slice(0, 5)
							.map((line, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: its whatever, just an error box
								<text key={index} fg={t.textTertiary}>
									{line.length > dialogWidth - 4
										? `${line.substring(0, dialogWidth - 7)}...`
										: line}
								</text>
							))}
					</box>
				</>
			)}
			<box style={{ height: 1 }} />
			<text fg={t.textTertiary}>Press Enter or Escape to close</text>
		</box>
	)
}
