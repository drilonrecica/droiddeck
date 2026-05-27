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
  if (!raw || typeof raw !== "object" || !("projects" in raw) || typeof raw.projects !== "object") {
    return emptyPreferences();
  }
  return raw as PreferencesFile;
}

export async function savePreferences(preferences: PreferencesFile, filePath = preferencesFilePath()): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.outputJson(filePath, preferences, { spaces: 2 });
}

export function getProjectPreferences(preferences: PreferencesFile, projectRoot: string): ProjectPreferences {
  return preferences.projects[projectRoot] ?? {};
}

export async function updateProjectPreferences(
  projectRoot: string,
  patch: ProjectPreferences,
  filePath = preferencesFilePath()
): Promise<ProjectPreferences> {
  const preferences = await loadPreferences(filePath);
  const next = { ...(preferences.projects[projectRoot] ?? {}), ...patch };
  preferences.projects[projectRoot] = next;
  await savePreferences(preferences, filePath);
  return next;
}
