import path from "node:path";
import fs from "fs-extra";
import type { ProjectInfo } from "../types/project.js";
import { normalizeModuleName } from "./paths.js";

const PROJECT_MARKERS = ["settings.gradle", "settings.gradle.kts", "gradlew"] as const;

export async function findProjectRoot(startDir = process.cwd()): Promise<string | undefined> {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (await hasAnyProjectMarker(currentDir)) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

export async function getProjectInfo(projectRoot: string, appModule = "app", projectName?: string): Promise<ProjectInfo> {
  const normalizedModule = normalizeModuleName(appModule);
  const settingsPath = await findSettingsPath(projectRoot);
  const gradlewPath = path.join(projectRoot, "gradlew");

  return {
    rootDir: projectRoot,
    name: projectName || path.basename(projectRoot),
    appModule: normalizedModule,
    gradlewPath: (await fs.pathExists(gradlewPath)) ? gradlewPath : undefined,
    settingsPath
  };
}

export async function isLikelyAndroidProjectRoot(projectRoot: string): Promise<boolean> {
  const hasGradlew = await fs.pathExists(path.join(projectRoot, "gradlew"));
  const hasSettings = Boolean(await findSettingsPath(projectRoot));
  return hasGradlew && hasSettings;
}

async function hasAnyProjectMarker(dir: string): Promise<boolean> {
  const checks = await Promise.all(PROJECT_MARKERS.map((marker) => fs.pathExists(path.join(dir, marker))));
  return checks.some(Boolean);
}

async function findSettingsPath(projectRoot: string): Promise<string | undefined> {
  const groovyPath = path.join(projectRoot, "settings.gradle");
  if (await fs.pathExists(groovyPath)) {
    return groovyPath;
  }

  const kotlinPath = path.join(projectRoot, "settings.gradle.kts");
  if (await fs.pathExists(kotlinPath)) {
    return kotlinPath;
  }

  return undefined;
}

