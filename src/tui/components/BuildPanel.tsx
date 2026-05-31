import type { TuiCommandState } from "../state.js";
import { Line } from "./Line.js";

export type BuildPanelProps = {
  command: TuiCommandState;
  focused: boolean;
};

export function BuildPanel({ command, focused }: BuildPanelProps) {
  const duration = command.startedAt ? `${Math.round(((command.endedAt ?? Date.now()) - command.startedAt) / 1000)}s` : "-";
  const contentRows = 1 + (command.error ? 1 : 0) + command.outputLines.slice(-6).length;

  return (
    <box title="Build / Run" flexDirection="column" border borderStyle="rounded" borderColor={focused ? "#38BDF8" : "#6B7280"} paddingX={1} height={contentRows + 2}>
      <Line>{`Last command: ${command.title} | Status: ${command.status.toUpperCase()} | Duration: ${duration}`}</Line>
      {command.error ? <Line fg="#EF4444">{command.error.replace(/\r?\n/g, " | ")}</Line> : null}
      {command.outputLines.slice(-6).map((line, index) => (
        <Line key={`${index}-${line}`} fg="#9CA3AF">
          {line}
        </Line>
      ))}
    </box>
  );
}
