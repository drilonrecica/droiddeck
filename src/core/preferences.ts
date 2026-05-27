import path from "node:path";
import fs from "fs-extra";
import type { LogMode } from "../types/config.js";
import { preferencesFilePath } from "./paths.js";

export type ProjectPreferences = {
  lastVariant?: string;
  lastDeviceId?: string;
  lastLogMode?: LogMode;
};

export type PreferencesFile = {
  projects: Record<string, ProjectPreferences>;
};

export function emptyPreferences(): PreferencesFile {
  return { projects: {} };
}

export async function loadPreferences(filePath = preferencesFilePath()): Promise<PreferencesFile> {
  if (!(await fs.pathExists(filePath))) {
    return emptyPreferences();
  }

  const raw = await fs.readJson(filePath);
  if (!isPreferencesFile(raw)) {
    return emptyPreferences();
  }

  return raw;
}

export async function savePreferences(preferences: PreferencesFile, filePath = preferencesFilePath()): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.outputJson(filePath, preferences, { spaces: 2 });
}

export function getProjectPreferences(preferences: PreferencesFile, projectRoot: string): ProjectPreferences {
  return preferences.projects[path.resolve(projectRoot)] ?? {};
}

export async function updateProjectPreferences(
  projectRoot: string,
  patch: ProjectPreferences,
  filePath = preferencesFilePath()
): Promise<ProjectPreferences> {
  const preferences = await loadPreferences(filePath);
  const key = path.resolve(projectRoot);
  const nextPreferences = {
    ...(preferences.projects[key] ?? {}),
    ...patch
  };

  preferences.projects[key] = nextPreferences;
  await savePreferences(preferences, filePath);
  return nextPreferences;
}

function isPreferencesFile(value: unknown): value is PreferencesFile {
  return (
    typeof value === "object" &&
    value !== null &&
    "projects" in value &&
    typeof (value as { projects?: unknown }).projects === "object" &&
    (value as { projects?: unknown }).projects !== null
  );
}

