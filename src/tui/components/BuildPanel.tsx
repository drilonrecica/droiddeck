import React from "react";
import { Box, Text } from "ink";
import type { CommandState } from "../../types/command.js";
import { formatDuration } from "../../utils/time.js";

export function BuildPanel({ state }: { state: CommandState }): React.ReactElement {
  const elapsed = state.startedAt ? formatDuration((state.endedAt ?? Date.now()) - state.startedAt) : undefined;
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>Build / Run</Text>
      <Text>Status: {state.status}{state.command ? `  Command: ${state.command}` : ""}{elapsed ? `  Duration: ${elapsed}` : ""}</Text>
      {state.error && <Text color="red">{state.error}</Text>}
      {state.outputLines.slice(-6).map((line, index) => (
        <Text key={`${index}-${line}`} dimColor>{line}</Text>
      ))}
    </Box>
  );
}
