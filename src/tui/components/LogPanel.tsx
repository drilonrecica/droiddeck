import type { LogLine } from "../../types/log.js";
import { isCrashLine } from "../../core/logcat.js";
import { Line } from "./Line.js";

export type LogPanelProps = {
  lines: readonly LogLine[];
  status: string;
  focused: boolean;
  scrollOffset: number;
  visibleLineLimit: number;
  warning?: string;
  error?: string;
};

export function LogPanel({ lines, status, focused, scrollOffset, visibleLineLimit, warning, error }: LogPanelProps) {
  const visibleLines = getVisibleLines(lines, scrollOffset, visibleLineLimit);
  const contentRows = (warning ? 1 : 0) + (error ? 1 : 0) + (lines.length === 0 ? 1 : visibleLines.length);

  return (
    <box title={`Logs (${status})`} flexDirection="column" border borderStyle="rounded" borderColor={focused ? "#38BDF8" : "#6B7280"} paddingX={1} height={contentRows + 2}>
      {warning ? <Line fg="#F59E0B">{warning}</Line> : null}
      {error ? <Line fg="#EF4444">{error.replace(/\r?\n/g, " | ")}</Line> : null}
      {lines.length === 0 ? <Line fg="#9CA3AF">Press g or focus logs and Enter to start.</Line> : null}
      {visibleLines.map((line, index) => (
        <Line key={`${index}-${line.raw}`} fg={isCrashLine(line) ? "#EF4444" : line.priority === "W" ? "#F59E0B" : "#D1D5DB"}>
          {line.raw}
        </Line>
      ))}
    </box>
  );
}

function getVisibleLines(lines: readonly LogLine[], scrollOffset: number, limit: number): readonly LogLine[] {
  if (lines.length === 0) {
    return [];
  }

  const safeLimit = Math.max(1, limit);
  const end = Math.max(safeLimit, lines.length - scrollOffset);
  const start = Math.max(0, end - safeLimit);

  return lines.slice(start, end);
}
