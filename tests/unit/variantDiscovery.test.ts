import { describe, expect, it } from "vitest";
import { extractFlavorAndBuildType, parseGradleTasks } from "../../src/core/variantDiscovery.js";

const gradleTasksOutput = `
installStagingDebug - Installs the Debug build.
assembleStagingDebug - Assembles main outputs.
testStagingDebugUnitTest - Run unit tests.
connectedStagingDebugAndroidTest - Run connected tests.
installDebug - Installs debug.
assembleRelease - Assembles release.
assembleBenchmark - Assembles custom build type.
`;

describe("variant discovery", () => {
  it("parses Gradle tasks into variants", () => {
    const variants = parseGradleTasks(gradleTasksOutput, "app");

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

  it("handles projects without flavors", () => {
    const variants = parseGradleTasks(gradleTasksOutput, "app");

    expect(variants).toContainEqual(
      expect.objectContaining({
        name: "debug",
        buildType: "debug",
        flavorName: undefined,
        installTask: ":app:installDebug"
      })
    );
  });

  it("preserves unknown build types without guessing", () => {
    expect(extractFlavorAndBuildType("benchmark")).toEqual({});
  });
});

