import { Line } from "./Line.js";

export function HelpPanel() {
  return (
    <box title="Help" flexDirection="column" border borderStyle="rounded" paddingX={1} height={7}>
      <Line>DroidDeck is keyboard-first. Use Tab/Shift+Tab to move focus and Enter to activate.</Line>
      <Line>Use arrows or j/k inside focused panels. v/d still open full variant and device pickers.</Line>
      <Line>Destructive actions are explicit: c clears app data and u asks before uninstalling.</Line>
      <Line>C clears only the visible DroidDeck log panel. It does not clear device Logcat.</Line>
      <Line>Press q to quit.</Line>
    </box>
  );
}
