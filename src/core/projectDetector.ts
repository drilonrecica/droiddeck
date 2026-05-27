import path from "node:path";
import fs from "fs-extra";
import type { ProjectInfo } from "../types/project.js";
import { normalizeModuleName } from "./paths.js";

export async function findProjectRoot(startDir = process.cwd()): Promise<string | undefined> {
  let current = path.resolve(startDir);

  while (true) {
    const hasMarker = await Promise.all([
      fs.pathExists(path.join(current, "settings.gradle")),
      fs.pathExists(path.join(current, "settings.gradle.kts")),
      fs.pathExists(path.join(current, "gradlew"))
    ]);

    if (hasMarker.some(Boolean)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

export async function getProjectInfo(projectRoot: string, appModule = "app", projectName?: string): Promise<ProjectInfo> {
  const settingsGroovy = path.join(projectRoot, "settings.gradle");
  const settingsKts = path.join(projectRoot, "settings.gradle.kts");
  const gradlewPath = path.join(projectRoot, "gradlew");
  const settingsPath = (await fs.pathExists(settingsGroovy))
    ? settingsGroovy
    : (await fs.pathExists(settingsKts))
      ? settingsKts
      : undefined;

  return {
    rootDir: projectRoot,
    name: projectName || path.basename(projectRoot),
    appModule: normalizeModuleName(appModule),
    gradlewPath: (await fs.pathExists(gradlewPath)) ? gradlewPath : undefined,
    settingsPath
  };
}
