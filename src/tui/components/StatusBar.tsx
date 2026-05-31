import type { DashboardFocusTarget } from "../navigation.js";
import { Line } from "./Line.js";

export type StatusBarProps = {
  focus: DashboardFocusTarget;
  message?: string;
};

const focusHelp: Record<DashboardFocusTarget, string> = {
  variants: "Tab focus | up/down/j/k move | Enter select | v picker",
  devices: "Tab focus | up/down/j/k move | Enter select | d picker",
  build: "Tab focus | r run | R clean | t tests | o report",
  logs: "Tab focus | Enter/g start | up/down scroll | C clear",
  actions: "Tab focus | up/down/j/k choose | Enter run"
};

export function StatusBar({ focus, message }: StatusBarProps) {
  return <Line fg={message ? "#F59E0B" : "#9CA3AF"}>{`Focus ${focus}: ${message ?? focusHelp[focus]}`}</Line>;
}
