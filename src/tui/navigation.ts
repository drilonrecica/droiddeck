import type { DashboardAction, DashboardActionId } from "./actions.js";

export const DASHBOARD_FOCUS_ORDER = ["variants", "devices", "build", "logs", "actions"] as const;

export type DashboardFocusTarget = (typeof DASHBOARD_FOCUS_ORDER)[number];

export type DashboardNavigationState = {
  focus: DashboardFocusTarget;
  variantIndex: number;
  deviceIndex: number;
  actionIndex: number;
  logScrollOffset: number;
};

export type DashboardNavigationCounts = {
  variants: number;
  devices: number;
  actions: number;
  logLines: number;
  visibleLogLines: number;
};

export type DashboardNavigationIntent =
  | { type: "select-variant"; index: number }
  | { type: "select-device"; index: number }
  | { type: "run-action"; actionId: DashboardActionId }
  | { type: "disabled-action"; actionId: DashboardActionId; message: string }
  | { type: "start-logs" }
  | { type: "none"; message?: string };

export function createDashboardNavigationState(focus: DashboardFocusTarget = "variants"): DashboardNavigationState {
  return {
    focus,
    variantIndex: 0,
    deviceIndex: 0,
    actionIndex: 0,
    logScrollOffset: 0
  };
}

export function setDashboardFocus(state: DashboardNavigationState, focus: DashboardFocusTarget): DashboardNavigationState {
  return {
    ...state,
    focus
  };
}

export function cycleDashboardFocus(state: DashboardNavigationState, direction: "next" | "previous"): DashboardNavigationState {
  const currentIndex = DASHBOARD_FOCUS_ORDER.indexOf(state.focus);
  const delta = direction === "next" ? 1 : -1;
  const nextIndex = wrapIndex(currentIndex + delta, DASHBOARD_FOCUS_ORDER.length);

  return setDashboardFocus(state, DASHBOARD_FOCUS_ORDER[nextIndex] ?? "variants");
}

export function moveFocusedDashboardItem(
  state: DashboardNavigationState,
  counts: DashboardNavigationCounts,
  direction: "next" | "previous"
): DashboardNavigationState {
  const delta = direction === "next" ? 1 : -1;

  if (state.focus === "variants") {
    return {
      ...state,
      variantIndex: wrapIndex(state.variantIndex + delta, counts.variants)
    };
  }

  if (state.focus === "devices") {
    return {
      ...state,
      deviceIndex: wrapIndex(state.deviceIndex + delta, counts.devices)
    };
  }

  if (state.focus === "actions") {
    return {
      ...state,
      actionIndex: wrapIndex(state.actionIndex + delta, counts.actions)
    };
  }

  if (state.focus === "logs") {
    const maxOffset = maxLogScrollOffset(counts);
    return {
      ...state,
      logScrollOffset: clamp(state.logScrollOffset + (direction === "previous" ? 1 : -1), 0, maxOffset)
    };
  }

  return state;
}

export function normalizeDashboardNavigationState(
  state: DashboardNavigationState,
  counts: DashboardNavigationCounts
): DashboardNavigationState {
  return {
    ...state,
    variantIndex: clampIndex(state.variantIndex, counts.variants),
    deviceIndex: clampIndex(state.deviceIndex, counts.devices),
    actionIndex: clampIndex(state.actionIndex, counts.actions),
    logScrollOffset: clamp(state.logScrollOffset, 0, maxLogScrollOffset(counts))
  };
}

export function activateFocusedDashboardItem(
  state: DashboardNavigationState,
  counts: DashboardNavigationCounts,
  actions: readonly DashboardAction[]
): DashboardNavigationIntent {
  const normalized = normalizeDashboardNavigationState(state, counts);

  if (normalized.focus === "variants") {
    return counts.variants > 0 ? { type: "select-variant", index: normalized.variantIndex } : { type: "none", message: "No variants available." };
  }

  if (normalized.focus === "devices") {
    return counts.devices > 0 ? { type: "select-device", index: normalized.deviceIndex } : { type: "none", message: "No online devices available." };
  }

  if (normalized.focus === "actions") {
    const selectedAction = actions[normalized.actionIndex];
    if (!selectedAction) {
      return { type: "none", message: "No actions available." };
    }

    if (!selectedAction.enabled) {
      return {
        type: "disabled-action",
        actionId: selectedAction.id,
        message: selectedAction.disabledReason ?? "Action is disabled."
      };
    }

    return {
      type: "run-action",
      actionId: selectedAction.id
    };
  }

  if (normalized.focus === "logs") {
    return { type: "start-logs" };
  }

  return { type: "none" };
}

function maxLogScrollOffset(counts: DashboardNavigationCounts): number {
  return Math.max(0, counts.logLines - counts.visibleLogLines);
}

function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return clamp(index, 0, count - 1);
}

function wrapIndex(index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }

  return ((index % count) + count) % count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
