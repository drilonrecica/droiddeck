import { describe, expect, it } from "vitest";
import { appendOutputLine, idleCommandState } from "../../src/tui/state.js";

describe("TUI state helpers", () => {
  it("creates idle command state", () => {
    expect(idleCommandState()).toEqual({
      title: "No command run yet",
      status: "idle",
      outputLines: []
    });
  });

  it("keeps only the latest bounded output lines", () => {
    const state = ["one", "two", "three"].reduce((current, line) => appendOutputLine(current, line, 2), idleCommandState());

    expect(state.outputLines).toEqual(["two", "three"]);
  });
});
