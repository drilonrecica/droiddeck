import os from "node:os";
import path from "node:path";

export const REPO_CONFIG_FILE = "droiddeck.config.json";

export function normalizeModuleName(moduleName: string | undefined): string {
  const normalized = moduleName?.trim() || "app";
  return normalized.startsWith(":") ? normalized.slice(1) : normalized;
}

export function moduleTaskPrefix(moduleName: string): string {
  return `:${normalizeModuleName(moduleName)}:`;
}

export function repoConfigPath(projectRoot: string): string {
  return path.join(projectRoot, REPO_CONFIG_FILE);
}

export function preferencesFilePath(homeDir = os.homedir()): string {
  return path.join(homeDir, ".droiddeck", "preferences.json");
}

export function screenshotsDir(projectRoot: string): string {
  return path.join(projectRoot, ".droiddeck", "screenshots");
}
