import { describe, expect, it } from "vitest";
import { parseGradleTasks } from "../../src/core/variantDiscovery.js";
import { resolveVariant } from "../../src/core/variantResolver.js";

const gradleOutput = `
installStagingDebug - Installs the Debug build.
assembleStagingDebug - Assembles.
testStagingDebugUnitTest - Run unit tests.
connectedStagingDebugAndroidTest - Run android tests.
installProductionRelease - Installs release.
assembleProductionRelease - Assembles release.
testProductionReleaseUnitTest - Run release unit tests.
`;

describe("variant discovery", () => {
  it("parses variant tasks", () => {
    const variants = parseGradleTasks(gradleOutput, "app");
    expect(variants).toContainEqual(
      expect.objectContaining({
        name: "stagingDebug",
        taskNamePart: "StagingDebug",
        buildType: "debug",
        flavorName: "staging",
        installTask: ":app:installStagingDebug",
        assembleTask: ":app:assembleStagingDebug",
        unitTestTask: ":app:testStagingDebugUnitTest",
        connectedTestTask: ":app:connectedStagingDebugAndroidTest"
      })
    );
  });

  it("resolves aliases and case-insensitive variants", () => {
    const variants = parseGradleTasks(gradleOutput, "app");
    expect(resolveVariant(variants, { staging: "stagingDebug" }, "staging").name).toBe("stagingDebug");
    expect(resolveVariant(variants, {}, "STAGINGDEBUG").name).toBe("stagingDebug");
  });
});
