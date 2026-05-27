import { describe, expect, it } from "vitest";
import { resolveVariant } from "../../src/core/variantResolver.js";
import type { AndroidVariant } from "../../src/types/variant.js";

const variants: AndroidVariant[] = [
  { name: "debug", taskNamePart: "Debug" },
  { name: "stagingDebug", taskNamePart: "StagingDebug" },
  { name: "productionRelease", taskNamePart: "ProductionRelease" }
];

describe("variant resolver", () => {
  it("resolves exact variants before aliases", () => {
    expect(resolveVariant(variants, { stagingDebug: "productionRelease" }, "stagingDebug").name).toBe("stagingDebug");
  });

  it("resolves aliases", () => {
    expect(resolveVariant(variants, { staging: "stagingDebug" }, "staging").name).toBe("stagingDebug");
  });

  it("resolves case-insensitive variant names", () => {
    expect(resolveVariant(variants, {}, "PRODUCTIONRELEASE").name).toBe("productionRelease");
  });

  it("uses fallback when input is missing", () => {
    expect(resolveVariant(variants, {}, undefined, "debug").name).toBe("debug");
  });

  it("throws a helpful error for unknown variants", () => {
    expect(() => resolveVariant(variants, { staging: "stagingDebug" }, "missing")).toThrow(/Available variants/);
  });
});

