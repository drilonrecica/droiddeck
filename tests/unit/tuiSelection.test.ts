import { describe, expect, it } from "vitest";
import { getSelectableAppVariants, resolveInitialVariantSelection } from "../../src/tui/selection.js";
import type { AndroidVariant } from "../../src/types/variant.js";

const flavoredVariants: AndroidVariant[] = [
  { name: "androidTest", taskNamePart: "AndroidTest" },
  { name: "debug", taskNamePart: "Debug", buildType: "debug", assembleTask: ":app:assembleDebug" },
  { name: "free", taskNamePart: "Free" },
  {
    name: "freeDebug",
    taskNamePart: "FreeDebug",
    buildType: "debug",
    flavorName: "free",
    installTask: ":app:installFreeDebug",
    assembleTask: ":app:assembleFreeDebug"
  },
  {
    name: "freeRelease",
    taskNamePart: "FreeRelease",
    buildType: "release",
    flavorName: "free",
    assembleTask: ":app:assembleFreeRelease"
  },
  { name: "freeDebugAndroidTest", taskNamePart: "FreeDebugAndroidTest", installTask: ":app:installFreeDebugAndroidTest" },
  { name: "freeDebugUnitTest", taskNamePart: "FreeDebugUnitTest" },
  { name: "paidDebug", taskNamePart: "PaidDebug", buildType: "debug", flavorName: "paid", installTask: ":app:installPaidDebug" },
  { name: "unitTest", taskNamePart: "UnitTest" }
];

describe("TUI variant selection", () => {
  it("keeps real app variants and removes aggregate/test variants", () => {
    expect(getSelectableAppVariants(flavoredVariants).map((variant) => variant.name)).toEqual(["freeDebug", "freeRelease", "paidDebug"]);
  });

  it("uses a valid persisted variant", () => {
    const selection = resolveInitialVariantSelection(flavoredVariants, "paidDebug");

    expect(selection.status).toBe("selected");
    expect(selection.status === "selected" ? selection.variant.name : undefined).toBe("paidDebug");
  });

  it("auto-selects when one selectable app variant exists", () => {
    const selection = resolveInitialVariantSelection([flavoredVariants[3]!]);

    expect(selection.status).toBe("selected");
    expect(selection.status === "selected" ? selection.variant.name : undefined).toBe("freeDebug");
  });

  it("requires interactive selection when multiple app variants exist", () => {
    const selection = resolveInitialVariantSelection(flavoredVariants);

    expect(selection.status).toBe("needs-selection");
  });

  it("ignores an invalid persisted variant without throwing", () => {
    const selection = resolveInitialVariantSelection(flavoredVariants, "missingDebug");

    expect(selection.status).toBe("needs-selection");
  });
});
