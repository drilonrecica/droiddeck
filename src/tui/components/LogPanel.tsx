import React from "react";
import { Box, Text } from "ink";
import type { LogLine } from "../../types/log.js";
import { isCrashLine } from "../../core/logcat.js";

export function LogPanel({ lines }: { lines: LogLine[] }): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>Logs</Text>
      {lines.slice(-8).map((line, index) => (
        <Text key={`${index}-${line.raw}`} color={isCrashLine(line) ? "red" : undefined}>
          {line.raw}
        </Text>
      ))}
      {lines.length === 0 && <Text dimColor>No DroidDeck log lines yet. Use `droiddeck logs` for live logcat streaming.</Text>}
    </Box>
  );
}
