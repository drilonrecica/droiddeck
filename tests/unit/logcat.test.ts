import { describe, expect, it } from "vitest";
import { isCrashLine, parseLogLine, shouldShowLogLine } from "../../src/core/logcat.js";

describe("logcat", () => {
  it("parses threadtime log lines and filters by priority", () => {
    const line = parseLogLine("05-27 10:12:13.456  1234  5678 E AndroidRuntime: FATAL EXCEPTION");
    expect(line).toMatchObject({ pid: "1234", tid: "5678", priority: "E", tag: "AndroidRuntime" });
    expect(shouldShowLogLine(line, "errors")).toBe(true);
    expect(shouldShowLogLine(line, "warnings")).toBe(true);
    expect(isCrashLine(line)).toBe(true);
  });
});
