import { useTerminalDimensions } from "@opentui/react"
import { useEffect, useState } from "react"
import { useConfig } from "../hooks/useConfig"
import type { ProcessId } from "../types"

interface TerminalOutputProps {
	processId: ProcessId
	output: string[]
}

export function TerminalOutput({ processId, output }: TerminalOutputProps) {
	const { height } = useTerminalDimensions()
	const { currentTheme: t } = useConfig()
	const [displayLines, setDisplayLines] = useState<string[]>([])

	useEffect(() => {
		// Keep only visible lines to prevent memory issues
		const maxLines = Math.max(10, height - 10)
		const lines = output.slice(-maxLines)
		setDisplayLines(lines)
	}, [output, height])

	if (!processId) {
		return (
			<box
				style={{
					flexGrow: 1,
					border: true,
					flexDirection: "column",
					paddingLeft: 1,
					paddingRight: 1,
					borderColor: t.border,
				}}
			>
				<text fg={t.header} attributes={1}>
					Output
				</text>
				<box style={{ height: 1 }} />
				<text fg={t.textSecondary}>Select a script to view output</text>
			</box>
		)
	}

	return (
		<box
			style={{
				flexGrow: 1,
				border: true,
				flexDirection: "column",
				paddingLeft: 1,
				paddingRight: 1,
				borderColor: t.border,
			}}
		>
			<text fg={t.header} attributes={1}>
				{processId}
			</text>
			<box style={{ height: 1 }} />
			<box style={{ flexDirection: "column", flexGrow: 1 }}>
				{displayLines.length === 0 ? (
					<text fg={t.textSecondary}>No output yet...</text>
				) : (
					displayLines.map((line) => (
						<text key={`${processId}`} fg={t.textPrimary}>
							{line || " "}
						</text>
					))
				)}
			</box>
		</box>
	)
}
