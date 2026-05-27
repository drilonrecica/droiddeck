import React from "react";
import { Box, Text } from "ink";

export function ActionsPanel(): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>Actions</Text>
      <Text>[r] run  [R] clean run  [v] variant  [d] device  [c] clear data</Text>
      <Text>[l] launch  [k] kill  [u] uninstall  [t] tests  [s] screenshot</Text>
      <Text>[g] logs  [D] doctor  [o] open report  [?] help  [q] quit</Text>
    </Box>
  );
}
