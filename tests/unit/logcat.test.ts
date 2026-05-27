import { describe, expect, it } from "vitest";
import {
  appendBoundedLogLine,
  isCrashLine,
  parseLogLine,
  selectLogMode,
  shouldShowLogLine
} from "../../src/core/logcat.js";

describe("logcat", () => {
  it("parses threadtime log lines", () => {
    expect(parseLogLine("05-27 10:12:13.456  1234  5678 E AndroidRuntime: FATAL EXCEPTION")).toEqual({
      timestamp: "05-27 10:12:13.456",
      pid: "1234",
      tid: "5678",
      priority: "E",
      tag: "AndroidRuntime",
      message: "FATAL EXCEPTION",
      raw: "05-27 10:12:13.456  1234  5678 E AndroidRuntime: FATAL EXCEPTION"
    });
  });

  it("filters by priority", () => {
    const warning = parseLogLine("05-27 10:12:13.456  1234  5678 W Network: Retry");
    const info = parseLogLine("05-27 10:12:13.456  1234  5678 I Network: Connected");

    expect(shouldShowLogLine(warning, { mode: "warnings" })).toBe(true);
    expect(shouldShowLogLine(info, { mode: "warnings" })).toBe(false);
  });

  it("filters by pid when provided", () => {
    const line = parseLogLine("05-27 10:12:13.456  1234  5678 E AndroidRuntime: Boom");

    expect(shouldShowLogLine(line, { mode: "errors", pid: "1234" })).toBe(true);
    expect(shouldShowLogLine(line, { mode: "errors", pid: "9999" })).toBe(false);
  });

  it("falls back to configured tags", () => {
    const line = parseLogLine("05-27 10:12:13.456  1234  5678 I Network: Connected");

    expect(shouldShowLogLine(line, { mode: "errors", tags: ["Network"] })).toBe(true);
  });

  it("detects crash lines", () => {
    expect(isCrashLine(parseLogLine("05-27 10:12:13.456  1234  5678 E AndroidRuntime: FATAL EXCEPTION"))).toBe(true);
  });

  it("keeps a bounded log buffer", () => {
    const one = parseLogLine("one");
    const two = parseLogLine("two");
    const three = parseLogLine("three");

    expect(appendBoundedLogLine(appendBoundedLogLine(appendBoundedLogLine([], one, 2), two, 2), three, 2)).toEqual([two, three]);
  });

  it("selects log mode from CLI flags", () => {
    expect(selectLogMode({ errors: true }, "warnings")).toBe("errors");
    expect(selectLogMode({ all: true }, "warnings")).toBe("all");
    expect(selectLogMode({ warnings: true }, "all")).toBe("warnings");
    expect(selectLogMode({}, "warnings")).toBe("warnings");
  });
});
