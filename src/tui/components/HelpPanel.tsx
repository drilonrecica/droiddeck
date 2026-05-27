import { Box, Text } from "ink";

export function HelpPanel(): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>Help</Text>
      <Text>DroidDeck is keyboard-first. Use v/d to select variant and device, then r to run.</Text>
      <Text>Destructive actions are explicit: c clears app data and u asks before uninstalling.</Text>
      <Text>C clears only the visible DroidDeck log panel. It does not clear device Logcat.</Text>
      <Text>Press q to quit.</Text>
    </Box>
  );
}
