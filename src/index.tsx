import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./components/App";

async function main() {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		targetFps: 30,
		useMouse: false,
		useAlternateScreen: true,
	});

	createRoot(renderer).render(<App />);
}

main().catch((error) => {
	console.error("Failed to start termplex:", error);
	process.exit(1);
});
