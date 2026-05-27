import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { findProjectRoot, getProjectInfo, isLikelyAndroidProjectRoot } from "../../src/core/projectDetector.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-project-test-${process.pid}`);

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("project detector", () => {
  it("finds a project root from a nested directory", async () => {
    const projectRoot = path.join(tempDir, "android-project");
    const nestedDir = path.join(projectRoot, "app", "src", "main");
    await fs.ensureDir(nestedDir);
    await fs.outputFile(path.join(projectRoot, "settings.gradle.kts"), "");

    await expect(findProjectRoot(nestedDir)).resolves.toBe(projectRoot);
  });

  it("returns undefined when no marker exists", async () => {
    const dir = path.join(tempDir, "not-a-project");
    await fs.ensureDir(dir);

    await expect(findProjectRoot(dir)).resolves.toBeUndefined();
  });

  it("identifies likely Android roots by wrapper and settings file", async () => {
    const projectRoot = path.join(tempDir, "android-project");
    await fs.ensureDir(projectRoot);
    await fs.outputFile(path.join(projectRoot, "settings.gradle"), "");
    await fs.outputFile(path.join(projectRoot, "gradlew"), "");

    await expect(isLikelyAndroidProjectRoot(projectRoot)).resolves.toBe(true);
  });

  it("builds project info with normalized module names", async () => {
    const projectRoot = path.join(tempDir, "android-project");
    await fs.ensureDir(projectRoot);
    await fs.outputFile(path.join(projectRoot, "settings.gradle"), "");
    await fs.outputFile(path.join(projectRoot, "gradlew"), "");

    await expect(getProjectInfo(projectRoot, ":app")).resolves.toEqual({
      rootDir: projectRoot,
      name: "android-project",
      appModule: "app",
      gradlewPath: path.join(projectRoot, "gradlew"),
      settingsPath: path.join(projectRoot, "settings.gradle")
    });
  });
});

