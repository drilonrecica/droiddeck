import { describe, expect, it } from "vitest";
import { defaultConfig, parseConfig } from "../../src/core/config.js";

describe("config", () => {
  it("returns MVP defaults", () => {
    expect(defaultConfig()).toEqual({
      appModule: "app",
      variantAliases: {},
      applicationIds: {},
      logcat: {
        defaultMode: "warnings",
        tags: []
      },
      actions: {
        launchMode: "monkey"
      }
    });
  });

  it("normalizes app module names", () => {
    expect(parseConfig({ appModule: ":mobile" }).appModule).toBe("mobile");
    expect(parseConfig({ appModule: "app" }).appModule).toBe("app");
  });

  it("validates activity launch config", () => {
    expect(() => parseConfig({ actions: { launchMode: "activity" } })).toThrow(/mainActivity/);
    expect(parseConfig({ actions: { launchMode: "activity" }, mainActivity: ".MainActivity" }).actions.launchMode).toBe("activity");
  });

  it("rejects unknown fields", () => {
    expect(() => parseConfig({ unknown: true })).toThrow();
  });
});

