import { describe, expect, it } from "vitest";
import { taskPartToVariantName, variantNameToTaskPart } from "../../src/utils/casing.js";

describe("casing", () => {
  it("converts Gradle task parts to variant names", () => {
    expect(taskPartToVariantName("StagingDebug")).toBe("stagingDebug");
    expect(taskPartToVariantName("ProductionRelease")).toBe("productionRelease");
    expect(taskPartToVariantName("Debug")).toBe("debug");
    expect(taskPartToVariantName("Release")).toBe("release");
  });

  it("converts variant names to Gradle task parts", () => {
    expect(variantNameToTaskPart("stagingDebug")).toBe("StagingDebug");
  });
});

