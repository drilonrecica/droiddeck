import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { loadPreferences, savePreferences, updateProjectPreferences } from "../../src/core/preferences.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-test-${process.pid}`);
const filePath = path.join(tempDir, "preferences.json");

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("preferences", () => {
  it("returns empty preferences when missing", async () => {
    await expect(loadPreferences(filePath)).resolves.toEqual({ projects: {} });
  });

  it("saves and updates project preferences", async () => {
    await savePreferences({ projects: {} }, filePath);
    await updateProjectPreferences("/tmp/project", { lastVariant: "debug" }, filePath);
    await expect(loadPreferences(filePath)).resolves.toEqual({
      projects: {
        "/tmp/project": {
          lastVariant: "debug"
        }
      }
    });
  });
});
