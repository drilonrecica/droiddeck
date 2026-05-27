import { Box, Text } from "ink";

export function ActionsPanel(): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Actions</Text>
      <Text>[r] run  [R] clean run  [v] variant  [d] device  [c] clear data</Text>
      <Text>[l] launch  [k] kill  [u] uninstall  [t] tests  [s] screenshot</Text>
      <Text>[g] logs  [D] doctor  [?] help  [o] open report  [C] clear logs  [q] quit</Text>
    </Box>
  );
}
