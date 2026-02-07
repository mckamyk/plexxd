import { CommandPalette } from "./CommandPalette"
import { Console } from "./Console"
import { LogViewer } from "./LogViewer"
import { ScriptList } from "./ScriptList"
import { TerminalOutput } from "./TerminalOutput"

export function App() {
	return (
		<box
			style={{
				flexDirection: "row",
				width: "100%",
				height: "100%",
				padding: 1,
			}}
		>
			<ScriptList />
			<box style={{ width: 1 }} />
			<TerminalOutput />

			<CommandPalette />
			<LogViewer />
			<Console />
		</box>
	)
}
