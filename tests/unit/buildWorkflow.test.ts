import { describe, expect, it } from "vitest";
import { selectVariantBuildTask } from "../../src/core/buildWorkflow.js";

describe("build workflow", () => {
  it("prefers install tasks", () => {
    expect(
      selectVariantBuildTask({
        name: "debug",
        taskNamePart: "Debug",
        installTask: ":app:installDebug",
        assembleTask: ":app:assembleDebug"
      })
    ).toEqual({
      task: ":app:installDebug",
      installs: true
    });
  });

  it("falls back to assemble tasks without installing", () => {
    expect(
      selectVariantBuildTask({
        name: "release",
        taskNamePart: "Release",
        assembleTask: ":app:assembleRelease"
      })
    ).toEqual({
      task: ":app:assembleRelease",
      installs: false
    });
  });

  it("fails when no build task exists", () => {
    expect(() => selectVariantBuildTask({ name: "debug", taskNamePart: "Debug" })).toThrow(/No install or assemble task/);
  });
});

