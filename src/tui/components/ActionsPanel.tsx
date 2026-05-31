import type { DashboardAction } from "../actions.js";
import { Line } from "./Line.js";

export type ActionsPanelProps = {
  actions: readonly DashboardAction[];
  highlightedIndex: number;
  focused: boolean;
};

export function ActionsPanel({ actions, highlightedIndex, focused }: ActionsPanelProps) {
  const selectedAction = actions[highlightedIndex] ?? actions[0];

  return (
    <box title="Actions" flexDirection="column" border borderStyle="rounded" borderColor={focused ? "#38BDF8" : "#6B7280"} paddingX={1} height={4}>
      {selectedAction ? (
        <>
          <Line fg={!selectedAction.enabled ? "#6B7280" : focused ? "#38BDF8" : "#D1D5DB"} bg={focused ? "#0F172A" : undefined}>
            {`> [${selectedAction.shortcut}] ${selectedAction.label}${selectedAction.enabled ? "" : " (disabled)"}`}
          </Line>
          <Line fg={selectedAction.enabled ? "#9CA3AF" : "#F59E0B"}>
            {selectedAction.enabled
              ? `${highlightedIndex + 1}/${actions.length}  Use arrows or j/k to choose, Enter to run.`
              : selectedAction.disabledReason ?? "Action is disabled."}
          </Line>
        </>
      ) : (
        <Line fg="#9CA3AF">No actions available.</Line>
      )}
    </box>
  );
}
