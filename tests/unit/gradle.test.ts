import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { requireGradleWrapper } from "../../src/core/gradle.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-gradle-test-${process.pid}`);

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("gradle", () => {
  it("fails when the Gradle wrapper is missing", async () => {
    await fs.ensureDir(tempDir);

    await expect(requireGradleWrapper(tempDir)).rejects.toThrow(/Gradle wrapper not found/);
  });

  it("fails when the Gradle wrapper JAR is missing", async () => {
    const gradlewPath = path.join(tempDir, "gradlew");
    await fs.outputFile(gradlewPath, "");

    await expect(requireGradleWrapper(tempDir)).rejects.toThrow(/Gradle wrapper JAR not found/);
  });

  it("returns the project Gradle wrapper path", async () => {
    const gradlewPath = path.join(tempDir, "gradlew");
    await fs.outputFile(gradlewPath, "");
    await fs.outputFile(path.join(tempDir, "gradle", "wrapper", "gradle-wrapper.jar"), "");

    await expect(requireGradleWrapper(tempDir)).resolves.toBe(gradlewPath);
  });
});
