import React from "react";
import { Box, Text } from "ink";

export function HelpPanel(): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>Help</Text>
      <Text>DroidDeck wraps Gradle and ADB commands for the selected Android variant and device.</Text>
      <Text>Use variant/device pickers before app-specific actions when auto-selection is not possible.</Text>
    </Box>
  );
}
