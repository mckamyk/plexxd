import type { ProcessId } from "../types"

export type OutputLine = {
	content: string
	offset: number
}

const outputBuffers = new Map<string, OutputLine[]>()
const subscribers = new Map<string, Set<(line: OutputLine) => void>>()

function getOutput(processId: string): OutputLine[] {
	return outputBuffers.get(processId) ?? []
}

function appendOutput(processId: string, content: string) {
	const buffer = outputBuffers.get(processId) ?? []
	const line = { content, offset: buffer.length }
	buffer.push(line)

	if (buffer.length > 1000) buffer.shift()
	outputBuffers.set(processId, buffer)

	subscribers.get(processId)?.forEach((cb) => void cb(line))
}

function clearOutput(processId: ProcessId) {
	outputBuffers.delete(processId)
}

function subscribeToOutput(
	processId: ProcessId,
	cb: (line: OutputLine) => void,
) {
	if (!subscribers.has(processId)) subscribers.set(processId, new Set())

	const existing = subscribers.get(processId)
	if (!existing) {
		return () => null
	}

	existing.add(cb)
	return () => existing.delete(cb)
}

export default {
	getOutput,
	appendOutput,
	clearOutput,
	subscribeToOutput,
}
