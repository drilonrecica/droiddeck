import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import {
  getProjectPreferences,
  loadPreferences,
  savePreferences,
  updateProjectPreferences
} from "../../src/core/preferences.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-preferences-test-${process.pid}`);
const preferencesPath = path.join(tempDir, "preferences.json");

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("preferences", () => {
  it("returns empty preferences when the file does not exist", async () => {
    await expect(loadPreferences(preferencesPath)).resolves.toEqual({ projects: {} });
  });

  it("saves and loads preferences", async () => {
    await savePreferences({ projects: { "/tmp/project": { lastVariant: "debug" } } }, preferencesPath);

    await expect(loadPreferences(preferencesPath)).resolves.toEqual({
      projects: {
        "/tmp/project": {
          lastVariant: "debug"
        }
      }
    });
  });

  it("updates preferences per absolute project path", async () => {
    const projectRoot = path.join(tempDir, "project");

    await updateProjectPreferences(projectRoot, { lastVariant: "stagingDebug" }, preferencesPath);
    await updateProjectPreferences(projectRoot, { lastDeviceId: "emulator-5554" }, preferencesPath);

    const preferences = await loadPreferences(preferencesPath);
    expect(getProjectPreferences(preferences, projectRoot)).toEqual({
      lastVariant: "stagingDebug",
      lastDeviceId: "emulator-5554"
    });
  });
});

