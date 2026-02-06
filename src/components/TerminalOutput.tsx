import { useProcess, useProcessList } from "../hooks/useProcessManager"
import { useModalIsOpened } from "../hooks/useView"
import { useTheme } from "../stores/themeStore"

export function TerminalOutput() {
	const { t } = useTheme()
	const { selected } = useProcessList()
	const process = useProcess(selected?.id)

	const isModalOpened = useModalIsOpened()

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
				borderColor: t.border,
			}}
		>
			<text fg={t.header} attributes={1}>
				{selected.scriptName}
			</text>
			<box style={{ height: 1 }} />
			<scrollbox
				live
				focused={!isModalOpened}
				style={{ flexDirection: "column", flexGrow: 1 }}
			>
				{!process ? (
					<text fg={t.textSecondary}>No output yet...</text>
				) : (
					process.output.map((line) => (
						<text key={`${selected.id}-${line.offset}`} fg={t.textPrimary}>
							{line.content || " "}
						</text>
					))
				)}
			</scrollbox>
		</box>
	)
}
