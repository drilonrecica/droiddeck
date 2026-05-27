import { Box, Text } from "ink";
import type { LogLine } from "../../types/log.js";
import { isCrashLine } from "../../core/logcat.js";

export type LogPanelProps = {
  lines: readonly LogLine[];
  status: string;
  warning?: string;
  error?: string;
};

export function LogPanel({ lines, status, warning, error }: LogPanelProps): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Logs ({status})</Text>
      {warning ? <Text color="yellow">{warning}</Text> : null}
      {error ? <Text color="red">{error}</Text> : null}
      {lines.length === 0 ? <Text dimColor>Press g to start or focus logs.</Text> : null}
      {lines.slice(-10).map((line, index) => (
        <Text key={`${index}-${line.raw}`} color={isCrashLine(line) ? "red" : line.priority === "W" ? "yellow" : undefined}>
          {line.raw}
        </Text>
      ))}
    </Box>
  );
}
