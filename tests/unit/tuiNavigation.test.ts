import { describe, expect, it } from "vitest";
import { createDashboardActions } from "../../src/tui/actions.js";
import {
  activateFocusedDashboardItem,
  createDashboardNavigationState,
  cycleDashboardFocus,
  moveFocusedDashboardItem,
  type DashboardNavigationCounts
} from "../../src/tui/navigation.js";

const counts: DashboardNavigationCounts = {
  variants: 3,
  devices: 2,
  actions: 4,
  logLines: 10,
  visibleLogLines: 3
};

describe("TUI dashboard navigation", () => {
  it("cycles focus forward like Tab", () => {
    const state = createDashboardNavigationState("variants");

    expect(cycleDashboardFocus(state, "next").focus).toBe("devices");
  });

  it("cycles focus backward like Shift+Tab", () => {
    const state = createDashboardNavigationState("variants");

    expect(cycleDashboardFocus(state, "previous").focus).toBe("actions");
  });

  it("wraps highlighted row indexes consistently", () => {
    const fromFirst = createDashboardNavigationState("variants");
    const fromLast = { ...fromFirst, variantIndex: 2 };

    expect(moveFocusedDashboardItem(fromFirst, counts, "previous").variantIndex).toBe(2);
    expect(moveFocusedDashboardItem(fromLast, counts, "next").variantIndex).toBe(0);
  });

  it("returns a variant selection intent from Enter", () => {
    const intent = activateFocusedDashboardItem({ ...createDashboardNavigationState("variants"), variantIndex: 1 }, counts, []);

    expect(intent).toEqual({ type: "select-variant", index: 1 });
  });

  it("returns a device selection intent from Enter", () => {
    const intent = activateFocusedDashboardItem({ ...createDashboardNavigationState("devices"), deviceIndex: 1 }, counts, []);

    expect(intent).toEqual({ type: "select-device", index: 1 });
  });

  it("returns an action intent from Enter", () => {
    const actions = createDashboardActions({ hasVariant: true, hasDevice: true, logsRunning: false });
    const intent = activateFocusedDashboardItem({ ...createDashboardNavigationState("actions"), actionIndex: 0 }, { ...counts, actions: actions.length }, actions);

    expect(intent).toEqual({ type: "run-action", actionId: "run" });
  });

  it("does not execute disabled actions", () => {
    const actions = createDashboardActions({ hasVariant: true, hasDevice: false, logsRunning: false });
    const intent = activateFocusedDashboardItem({ ...createDashboardNavigationState("actions"), actionIndex: 0 }, { ...counts, actions: actions.length }, actions);

    expect(intent).toEqual({
      type: "disabled-action",
      actionId: "run",
      message: "Select an online device first."
    });
  });

  it("starts logs when logs panel is activated", () => {
    const intent = activateFocusedDashboardItem(createDashboardNavigationState("logs"), counts, []);

    expect(intent).toEqual({ type: "start-logs" });
  });
});
