import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { doctorExitCode, formatDoctorCheck, runDoctor } from "../../src/core/doctor.js";
import type { CommandResult } from "../../src/types/command.js";
import type { DoctorCheck } from "../../src/types/doctor.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-doctor-test-${process.pid}`);

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("doctor", () => {
  it("formats doctor checks", () => {
    const check: DoctorCheck = {
      id: "node",
      label: "Node.js version supported",
      status: "pass",
      message: "Node.js 20.0.0"
    };

    expect(formatDoctorCheck(check)).toBe("PASS Node.js version supported: Node.js 20.0.0");
  });

  it("returns zero exit code for warning-only checks", () => {
    expect(
      doctorExitCode([
        { id: "warning", label: "Warning", status: "warn", message: "Limited." },
        { id: "pass", label: "Pass", status: "pass", message: "Ok." }
      ])
    ).toBe(0);
  });

  it("returns nonzero exit code for failing checks", () => {
    expect(doctorExitCode([{ id: "fail", label: "Fail", status: "fail", message: "Broken." }])).toBe(1);
  });

  it("reports missing project roots with suggestions", async () => {
    const startDir = path.join(tempDir, "not-project");
    const preferencesPath = path.join(tempDir, "preferences.json");
    await fs.ensureDir(startDir);

    const checks = await runDoctor({
      startDir,
      preferencesPath,
      platform: "darwin",
      nodeVersion: "20.0.0",
      env: {},
      commandRunner: fakeCommandRunner()
    });

    const projectRoot = checks.find((check) => check.id === "project-root");
    expect(projectRoot).toMatchObject({
      status: "fail",
      suggestion: "Run DroidDeck from an Android project directory."
    });
  });

  it("reports invalid config files", async () => {
    const projectRoot = path.join(tempDir, "project");
    const preferencesPath = path.join(tempDir, "preferences.json");
    await fs.ensureDir(projectRoot);
    await fs.outputFile(path.join(projectRoot, "settings.gradle"), "");
    await fs.outputFile(path.join(projectRoot, "gradlew"), "");
    await fs.outputJson(path.join(projectRoot, "droiddeck.config.json"), { actions: { launchMode: "activity" } });

    const checks = await runDoctor({
      startDir: projectRoot,
      preferencesPath,
      platform: "darwin",
      nodeVersion: "20.0.0",
      env: {},
      commandRunner: fakeCommandRunner()
    });

    expect(checks.find((check) => check.id === "config")).toMatchObject({
      status: "fail",
      suggestion: "Fix droiddeck.config.json or remove it to use defaults."
    });
  });
});

function fakeCommandRunner(): (file: string, args?: readonly string[]) => Promise<CommandResult> {
  return async (file: string, args: readonly string[] = []) => {
    const command = [file, ...args].join(" ");
    if (file === "adb" && args[0] === "version") {
      return { command, exitCode: 1, stdout: "", stderr: "", outputLines: [] };
    }
    if (file === "adb" && args[0] === "devices") {
      return { command, exitCode: 0, stdout: "List of devices attached\n", stderr: "", outputLines: ["List of devices attached"] };
    }
    return { command, exitCode: 0, stdout: "", stderr: "", outputLines: [] };
  };
}

describe("doctor device integration", () => {
  it("uses reusable device parsing for connected device checks", async () => {
    const startDir = path.join(tempDir, "not-project-device-check");
    const preferencesPath = path.join(tempDir, "device-check-preferences.json");
    await fs.ensureDir(startDir);

    const checks = await runDoctor({
      startDir,
      preferencesPath,
      platform: "darwin",
      nodeVersion: "20.0.0",
      env: {},
      commandRunner: async (file: string, args: readonly string[] = []) => {
        const command = [file, ...args].join(" ");
        if (file === "adb" && args[0] === "version") {
          return { command, exitCode: 0, stdout: "Android Debug Bridge version", stderr: "", outputLines: [] };
        }
        if (file === "adb" && args[0] === "devices") {
          return {
            command,
            exitCode: 0,
            stdout: "List of devices attached\nemulator-5554 device model:Pixel_8\n",
            stderr: "",
            outputLines: []
          };
        }
        return { command, exitCode: 0, stdout: "", stderr: "", outputLines: [] };
      }
    });

    expect(checks.find((check) => check.id === "connected-devices")).toMatchObject({
      status: "pass",
      message: "1 online device(s)."
    });
  });
});
