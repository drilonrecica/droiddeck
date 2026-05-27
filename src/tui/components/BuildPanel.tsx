import { Box, Text } from "ink";
import type { TuiCommandState } from "../state.js";

export type BuildPanelProps = {
  command: TuiCommandState;
};

export function BuildPanel({ command }: BuildPanelProps): JSX.Element {
  const duration = command.startedAt ? `${Math.round(((command.endedAt ?? Date.now()) - command.startedAt) / 1000)}s` : "-";

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Build / Run</Text>
      <Text>
        Last command: {command.title} | Status: {command.status.toUpperCase()} | Duration: {duration}
      </Text>
      {command.error ? <Text color="red">{command.error}</Text> : null}
      {command.outputLines.slice(-6).map((line, index) => (
        <Text key={`${index}-${line}`} dimColor>
          {line}
        </Text>
      ))}
    </Box>
  );
}
