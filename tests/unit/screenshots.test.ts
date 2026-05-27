import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildScreenshotPath } from "../../src/core/screenshots.js";
import type { AndroidDevice } from "../../src/types/device.js";
import type { AndroidVariant } from "../../src/types/variant.js";

describe("screenshots", () => {
  it("builds project-local screenshot paths", () => {
    const device: AndroidDevice = {
      id: "emulator:5554",
      state: "device",
      isEmulator: true,
      rawLine: "emulator:5554 device"
    };
    const variant: AndroidVariant = {
      name: "stagingDebug",
      taskNamePart: "StagingDebug"
    };
    const date = new Date(2026, 4, 27, 14, 5, 9);

    expect(buildScreenshotPath("/tmp/project", device, variant, date)).toBe(
      path.join("/tmp/project", ".droiddeck", "screenshots", "screenshot-stagingDebug-emulator_5554-20260527-140509.png")
    );
  });
});
