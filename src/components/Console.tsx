import { useKeyboard, useRenderer } from "@opentui/react"

export const Console = () => {
	const renderer = useRenderer()
	useKeyboard((key) => {
		if (key.name === "`") {
			renderer.console.toggle()
		}
	})

	return null
}
