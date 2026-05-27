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
