import { describe, expect, it } from "vitest";
import { defaultConfig, parseConfig } from "../../src/core/config.js";

describe("config", () => {
  it("uses safe defaults", () => {
    expect(defaultConfig()).toMatchObject({
      appModule: "app",
      variantAliases: {},
      applicationIds: {},
      logcat: { defaultMode: "warnings", tags: [] },
      actions: { launchMode: "monkey" }
    });
  });

  it("normalizes app modules and validates activity launch", () => {
    expect(parseConfig({ appModule: ":mobile" }).appModule).toBe("mobile");
    expect(() => parseConfig({ actions: { launchMode: "activity" } })).toThrow();
  });
});
