import { useTerminalDimensions } from "@opentui/react";
import React from "react";
import type { ListItem, ProcessId } from "../types";

interface ScriptListProps {
	items: ListItem[];
	selectedIndex: number;
	isRunning: (processId: ProcessId) => boolean;
}

export function ScriptList({
	items,
	selectedIndex,
	isRunning,
}: ScriptListProps) {
	const { width } = useTerminalDimensions();

	if (items.length === 0) {
		return (
			<box
				flexBasis={width * 0.3}
				style={{
					border: true,
					flexDirection: "column",
					paddingLeft: 1,
					paddingRight: 1,
				}}
			>
				<text fg="#888888">No scripts found in package.json</text>
			</box>
		);
	}

	return (
		<box
			flexBasis={width * 0.3}
			style={{
				border: true,
				flexDirection: "column",
				paddingLeft: 1,
				paddingRight: 1,
			}}
		>
			<text fg="#FFFF00" attributes={1}>
				Scripts
			</text>
			<box style={{ height: 1 }} />
			{items.map((item, index) => {
				const isSelected = index === selectedIndex;

				// Separator line
				if (item.type === "separator") {
					return (
						<box
							key={item.id}
							style={{
								height: 1,
								borderBottom: true,
								borderColor: "#64748b",
							}}
						/>
					);
				}

				// Package header
				if (item.type === "header") {
					return (
						<box
							key={item.id}
							style={{
								height: 1,
								backgroundColor: isSelected ? "#2563eb" : undefined,
								flexDirection: "row",
								justifyContent: "space-between",
							}}
						>
							<text fg={isSelected ? "#FFFFFF" : "#FFFF00"}>
								{item.collapsed ? "▶" : "▼"} {item.packagePath} (
								{item.scriptCount})
							</text>
							{item.collapsed && item.hasRunningScript && (
								<text fg="#22c55e">●</text>
							)}
						</box>
					);
				}

				// Script item
				const running = isRunning(item.id);
				const bg = isSelected ? "#2563eb" : undefined;
				const fg = isSelected ? "#FFFFFF" : running ? "#22c55e" : "#94a3b8";
				const prefix = item.packagePath ? "  " : ""; // Indent package scripts

				return (
					<box
						key={item.id}
						style={{
							height: 1,
							backgroundColor: bg,
							flexDirection: "row",
						}}
					>
						<text fg={fg}>
							{prefix}
							{running ? "● " : "○ "}
							{item.scriptName}
						</text>
					</box>
				);
			})}
		</box>
	);
}
