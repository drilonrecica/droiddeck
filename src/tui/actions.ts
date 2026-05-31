export type DashboardActionId =
  | "run"
  | "clean-run"
  | "select-variant"
  | "select-device"
  | "clear-data"
  | "launch"
  | "kill"
  | "uninstall"
  | "test"
  | "screenshot"
  | "logs"
  | "doctor"
  | "help"
  | "open-report"
  | "clear-logs"
  | "quit";

export type DashboardAction = {
  id: DashboardActionId;
  label: string;
  shortcut: string;
  enabled: boolean;
  disabledReason?: string;
};

export type DashboardActionContext = {
  hasVariant: boolean;
  hasDevice: boolean;
  logsRunning: boolean;
};

export function createDashboardActions(context: DashboardActionContext): DashboardAction[] {
  const readyReason = readySelectionDisabledReason(context);
  const variantReason = variantDisabledReason(context);

  return [
    action("run", "Run selected variant", "r", readyReason),
    action("clean-run", "Clean run selected variant", "R", readyReason),
    action("select-variant", "Select variant", "v"),
    action("select-device", "Select device", "d"),
    action("clear-data", "Clear app data", "c", readyReason),
    action("launch", "Launch app", "l", readyReason),
    action("kill", "Kill app", "K", readyReason),
    action("uninstall", "Uninstall app", "u", readyReason),
    action("test", "Run unit tests", "t", variantReason),
    action("screenshot", "Capture screenshot", "s", readyReason),
    action("logs", context.logsRunning ? "Focus logs" : "Start logs", "g", readyReason),
    action("doctor", "Run doctor", "D"),
    action("help", "Open help", "?"),
    action("open-report", "Open latest test report", "o", variantReason),
    action("clear-logs", "Clear visible logs", "C"),
    action("quit", "Quit", "q")
  ];
}

function action(id: DashboardActionId, label: string, shortcut: string, disabledReason?: string): DashboardAction {
  return {
    id,
    label,
    shortcut,
    enabled: !disabledReason,
    disabledReason
  };
}

function variantDisabledReason(context: DashboardActionContext): string | undefined {
  return context.hasVariant ? undefined : "Select a variant first.";
}

function readySelectionDisabledReason(context: DashboardActionContext): string | undefined {
  if (!context.hasVariant) {
    return "Select a variant first.";
  }

  if (!context.hasDevice) {
    return "Select an online device first.";
  }

  return undefined;
}
