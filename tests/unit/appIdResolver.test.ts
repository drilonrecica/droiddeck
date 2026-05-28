import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { afterEach, describe, expect, it } from "vitest";
import { defaultConfig } from "../../src/core/config.js";
import {
  inferApplicationIdFromGradleFiles,
  resolveApplicationId,
  withResolvedApplicationId
} from "../../src/core/appIdResolver.js";
import type { AndroidVariant } from "../../src/types/variant.js";

const tempDir = path.join(os.tmpdir(), `droiddeck-app-id-test-${process.pid}`);
const debugVariant: AndroidVariant = {
  name: "debug",
  taskNamePart: "Debug",
  buildType: "debug"
};
const stagingDebugVariant: AndroidVariant = {
  name: "stagingDebug",
  taskNamePart: "StagingDebug",
  flavorName: "staging",
  buildType: "debug"
};

afterEach(async () => {
  await fs.remove(tempDir);
});

describe("application ID resolver", () => {
  it("resolves application IDs from config", async () => {
    const config = {
      ...defaultConfig(),
      applicationIds: {
        debug: "com.example.configured"
      }
    };

    await expect(resolveApplicationId(config, debugVariant)).resolves.toBe("com.example.configured");
  });

  it("prefers config over inferred values", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId "com.example.inferred"
  }
}
`);
    const config = {
      ...defaultConfig(),
      applicationIds: {
        debug: "com.example.configured"
      }
    };

    await expect(resolveApplicationId(config, debugVariant, { projectRoot })).resolves.toBe("com.example.configured");
  });

  it("infers a simple Gradle applicationId", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId "com.example.app"
  }
}
`);

    await expect(inferApplicationIdFromGradleFiles(projectRoot, "app", debugVariant)).resolves.toBe("com.example.app");
  });

  it("infers a simple build type applicationIdSuffix", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId = "com.example.app"
  }
  buildTypes {
    debug {
      applicationIdSuffix ".debug"
    }
  }
}
`);

    await expect(inferApplicationIdFromGradleFiles(projectRoot, "app", debugVariant)).resolves.toBe("com.example.app.debug");
  });

  it("infers unambiguous flavor and build type suffixes from named Gradle blocks", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId = "com.example.app"
  }
  productFlavors {
    named("staging") {
      applicationIdSuffix = ".staging"
    }
  }
  buildTypes {
    getByName("debug") {
      applicationIdSuffix = ".debug"
    }
  }
}
`);

    await expect(inferApplicationIdFromGradleFiles(projectRoot, "app", stagingDebugVariant)).resolves.toBe("com.example.app.staging.debug");
  });

  it("infers sample-style flavor applicationId overrides with build type suffixes", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId "com.example.base"
  }
  productFlavors {
    VanillaFlavor {
      applicationId "com.example.vanilla"
    }
    ChocolateFlavor {
      applicationId "com.example.chocolate"
    }
  }
  buildTypes {
    debug {
      applicationIdSuffix ".debug"
    }
  }
}
`);

    await expect(
      inferApplicationIdFromGradleFiles(projectRoot, "app", {
        name: "vanillaFlavorDebug",
        taskNamePart: "VanillaFlavorDebug",
        flavorName: "vanillaFlavor",
        buildType: "debug"
      })
    ).resolves.toBe("com.example.vanilla.debug");
  });

  it("infers custom build types from declared Gradle blocks when variant metadata is incomplete", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId "com.example.base"
  }
  productFlavors {
    ChocolateFlavor {
      applicationId "com.example.chocolate"
    }
  }
  buildTypes {
    qa {
      applicationIdSuffix ".qa"
    }
  }
}
`);

    await expect(
      inferApplicationIdFromGradleFiles(projectRoot, "app", {
        name: "chocolateFlavorQa",
        taskNamePart: "ChocolateFlavorQa"
      })
    ).resolves.toBe("com.example.chocolate.qa");
  });

  it("does not infer when declarations are ambiguous", async () => {
    const projectRoot = await createProjectBuildFile(`
android {
  defaultConfig {
    applicationId "com.example.one"
    applicationId "com.example.two"
  }
}
`);

    await expect(inferApplicationIdFromGradleFiles(projectRoot, "app", debugVariant)).resolves.toBeUndefined();
    await expect(resolveApplicationId(defaultConfig(), debugVariant, { projectRoot })).rejects.toThrow(
      /"debug": "your\.package\.name"/
    );
  });

  it("throws an actionable config snippet when missing", async () => {
    await expect(resolveApplicationId(defaultConfig(), debugVariant)).rejects.toThrow(
      /"debug": "your\.package\.name"/
    );
  });

  it("can attach a resolved applicationId to variant data", async () => {
    const config = {
      ...defaultConfig(),
      applicationIds: {
        debug: "com.example.configured"
      }
    };

    await expect(withResolvedApplicationId(config, debugVariant)).resolves.toMatchObject({
      name: "debug",
      applicationId: "com.example.configured"
    });
  });
});

async function createProjectBuildFile(contents: string): Promise<string> {
  const projectRoot = path.join(tempDir, `project-${Math.random().toString(16).slice(2)}`);
  await fs.outputFile(path.join(projectRoot, "app", "build.gradle"), contents);
  return projectRoot;
}
