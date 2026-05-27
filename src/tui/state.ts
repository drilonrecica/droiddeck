import type { CommandState, CommandStatus } from "../types/command.js";

export type DashboardView = "dashboard" | "variants" | "devices" | "doctor" | "help" | "confirm-uninstall" | "logs";

export type TuiCommandStatus = CommandStatus;

export type TuiCommandState = CommandState;

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
