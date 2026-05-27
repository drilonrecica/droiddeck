import { describe, expect, it } from "vitest";
import { getAppStatus } from "../../src/core/appStatus.js";

describe("app status", () => {
  it("returns running when pidof returns a PID", async () => {
    const commandRunner = async () => ({
      command: "adb -s emulator-5554 shell pidof com.example.app",
      exitCode: 0,
      stdout: "123\n",
      stderr: "",
      outputLines: ["123"]
    });

    await expect(getAppStatus("emulator-5554", "com.example.app", commandRunner)).resolves.toBe("running");
  });

  it("returns not running when pidof does not find the process", async () => {
    const commandRunner = async () => ({
      command: "adb -s emulator-5554 shell pidof com.example.app",
      exitCode: 1,
      stdout: "",
      stderr: "pidof: not found",
      outputLines: ["pidof: not found"]
    });

    await expect(getAppStatus("emulator-5554", "com.example.app", commandRunner)).resolves.toBe("not running");
  });
});
