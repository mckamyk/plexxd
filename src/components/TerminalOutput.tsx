import type { ScrollBoxRenderable } from "@opentui/core"
import { useKeyboard } from "@opentui/react"
import { useEffect, useRef, useState } from "react"
import { useProcess, useProcessList } from "../hooks/useProcessManager"
import { useModalIsOpened, useTerminalOutput, useTheme } from "../stores"
import type { OutputLine } from "../stores/outputStore"
import outputStore from "../stores/outputStore"

export function TerminalOutput() {
	const { t } = useTheme()
	const { selected } = useProcessList()
	const process = useProcess(selected?.id)
	const ref = useRef<ScrollBoxRenderable>(null)
	const processId = selected?.id
	const [lines, setLines] = useState<OutputLine[]>(
		outputStore.getOutput(processId),
	)

	useEffect(() => {
		if (!processId) return () => {}
		const updater = (line: OutputLine) => {
			setLines((lines) => [...lines, line])
		}
		return outputStore.subscribeToOutput(processId, updater)
	}, [processId])

	const isModalOpened = useModalIsOpened()
	const [terminalFocused, setTerminalFocused] = useTerminalOutput()
	const focused = !isModalOpened && terminalFocused

	useKeyboard((key) => {
		if (!focused) return
		if (key.name === "escape" || key.name === "q") {
			setTerminalFocused(false)
		}
	})

	if (!selected) {
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
				borderColor: focused ? t.success : t.border,
			}}
		>
			<text fg={t.header} attributes={1}>
				{selected.scriptName}
			</text>
			<box style={{ height: 1 }} />
			<scrollbox
				ref={ref}
				stickyScroll={true}
				stickyStart="bottom"
				focused={focused}
				style={{ flexDirection: "column", flexGrow: 1 }}
			>
				{!process ? (
					<text fg={t.textSecondary}>No output yet...</text>
				) : (
					lines.map((line) => (
						<text key={`${selected.id}-${line.offset}`} fg={t.textPrimary}>
							{line.content || " "}
						</text>
					))
				)}
			</scrollbox>
		</box>
	)
}
