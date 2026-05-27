import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  openTestReportIfExists,
  runAllUnitTests,
  runConnectedTests,
  runUnitTests,
  testReportPath,
  testStatusMessage,
  unitTestTasks
} from "../../src/core/testRunner.js";
import type { AndroidVariant } from "../../src/types/variant.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-test-runner-${process.pid}`);
const variant: AndroidVariant = {
  name: "stagingDebug",
  taskNamePart: "StagingDebug",
  unitTestTask: ":app:testStagingDebugUnitTest",
  connectedTestTask: ":app:connectedStagingDebugAndroidTest"
};

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("test runner", () => {
  it("builds selected variant unit test report paths", () => {
    expect(testReportPath("/tmp/project", "app", variant)).toBe(
      path.join("/tmp/project", "app", "build", "reports", "tests", "testStagingDebugUnitTest", "index.html")
    );
  });

  it("normalizes app module names in report paths", () => {
    expect(testReportPath("/tmp/project", ":mobile", variant)).toBe(
      path.join("/tmp/project", "mobile", "build", "reports", "tests", "testStagingDebugUnitTest", "index.html")
    );
  });

  it("returns pass/fail status messages", () => {
    expect(testStatusMessage({ exitCode: 0 })).toBe("TESTS PASSED");
    expect(testStatusMessage({ exitCode: 1 })).toBe("TESTS FAILED");
  });

  it("fails clearly when a variant has no unit test task", async () => {
    await expect(runUnitTests(tempDir, { name: "release", taskNamePart: "Release" })).rejects.toThrow(/No unit test task/);
  });

  it("selects all discovered unit test tasks", () => {
    expect(
      unitTestTasks([
        variant,
        { name: "release", taskNamePart: "Release" },
        { name: "debug", taskNamePart: "Debug", unitTestTask: ":app:testDebugUnitTest" }
      ])
    ).toEqual([":app:testStagingDebugUnitTest", ":app:testDebugUnitTest"]);
  });

  it("fails clearly when all unit tests have no tasks", async () => {
    await expect(runAllUnitTests(tempDir, [{ name: "release", taskNamePart: "Release" }])).rejects.toThrow(/No unit test tasks/);
  });

  it("fails clearly when a variant has no connected test task", async () => {
    await expect(runConnectedTests(tempDir, { name: "release", taskNamePart: "Release" })).rejects.toThrow(/No connected Android test task/);
  });

  it("opens a report only when it exists", async () => {
    const reportPath = testReportPath(tempDir, "app", variant);
    const opened: string[] = [];
    await fs.outputFile(reportPath, "<html></html>");

    await expect(openTestReportIfExists(tempDir, "app", variant, async (target) => opened.push(target))).resolves.toBe(reportPath);
    expect(opened).toEqual([reportPath]);
  });

  it("returns undefined when a report is missing", async () => {
    const opened: string[] = [];

    await expect(openTestReportIfExists(tempDir, "app", variant, async (target) => opened.push(target))).resolves.toBeUndefined();
    expect(opened).toEqual([]);
  });
});
