export type DashboardView = "dashboard" | "variants" | "devices" | "doctor" | "help" | "confirm-uninstall" | "logs";

export type TuiCommandStatus = "idle" | "running" | "success" | "failed";

export type TuiCommandState = {
  title: string;
  status: TuiCommandStatus;
  outputLines: string[];
  error?: string;
  startedAt?: number;
  endedAt?: number;
};

export function idleCommandState(): TuiCommandState {
  return {
    title: "No command run yet",
    status: "idle",
    outputLines: []
  };
}

export function appendOutputLine(state: TuiCommandState, line: string, maxLines = 20): TuiCommandState {
  return {
    ...state,
    outputLines: [...state.outputLines, line].slice(-maxLines)
  };
}
