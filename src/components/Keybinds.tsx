import { useProcess, useProcessList } from "../hooks/useProcessManager"
import { useFocus, useTheme } from "../stores"

export const Keybinds = () => {
	const focused = useFocus()

	if (focused === "scriptList") {
		return <ScriptListKeybinds />
	}
	if (focused === "terminalOutput") {
		return <TerminalOutputKeybinds />
	}
}

const TerminalOutputKeybinds = () => {
	const { t } = useTheme()

	return (
		<box>
			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					q
				</text>
				<text style={{ fg: t.textPrimary }}>Back to List</text>
			</box>
		</box>
	)
}

const ScriptListKeybinds = () => {
	const { selected } = useProcessList()
	const proc = useProcess(selected.id)
	const running = proc?.isRunning
	const { t } = useTheme()

	return (
		<box>
			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					↑
				</text>
				<text style={{ fg: t.textPrimary }}>up/k</text>
			</box>

			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					↓
				</text>
				<text style={{ fg: t.textPrimary }}>down/j</text>
			</box>

			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					{running ? "Focus Output" : "Start"}
				</text>
				<text style={{ fg: t.textPrimary }}>enter/⏎</text>
			</box>

			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					{running ? "Stop" : "Clear Output"}
				</text>
				<text style={{ fg: t.textPrimary }}>x</text>
			</box>

			<box flexDirection="row">
				<text flexGrow={1} style={{ fg: t.textPrimary }}>
					Kill All and Exit
				</text>
				<text style={{ fg: t.textPrimary }}>q</text>
			</box>
		</box>
	)
}
