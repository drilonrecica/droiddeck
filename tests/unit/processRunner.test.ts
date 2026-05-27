import { describe, expect, it } from "vitest";
import { runCommand, streamCommand, trackedProcessCount, waitForTrackedProcesses } from "../../src/core/processRunner.js";

describe("process runner", () => {
  it("captures successful command output", async () => {
    const result = await runCommand(process.execPath, ["-e", "console.log('ok')"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("ok");
    expect(result.outputLines).toContain("ok");
  });

  it("does not throw on command failure by default", async () => {
    const result = await runCommand(process.execPath, ["-e", "process.exit(7)"]);

    expect(result.exitCode).toBe(7);
  });

  it("streams output lines", async () => {
    const lines: string[] = [];

    await runCommand(process.execPath, ["-e", "console.log('line-one'); console.log('line-two')"], {
      onLine: (line) => lines.push(line)
    });

    expect(lines).toEqual(["line-one", "line-two"]);
  });

  it("bounds retained output lines", async () => {
    const result = await runCommand(process.execPath, ["-e", "console.log('one'); console.log('two'); console.log('three')"], {
      maxOutputLines: 2
    });

    expect(result.outputLines).toEqual(["two", "three"]);
  });

  it("tracks and stops streaming child processes", async () => {
    const stream = streamCommand(process.execPath, ["-e", "setInterval(() => console.log('tick'), 20)"]);
    expect(trackedProcessCount()).toBeGreaterThan(0);

    stream.stop();
    await stream.done;
    await waitForTrackedProcesses();

    expect(trackedProcessCount()).toBe(0);
  });
});
