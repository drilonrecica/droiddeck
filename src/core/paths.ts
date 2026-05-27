import path from "node:path";
import os from "node:os";

export function preferencesFilePath(): string {
  return path.join(os.homedir(), ".droiddeck", "preferences.json");
}

export function repoConfigPath(projectRoot: string): string {
  return path.join(projectRoot, "droiddeck.config.json");
}

export function screenshotsDir(projectRoot: string): string {
  return path.join(projectRoot, ".droiddeck", "screenshots");
}

export function normalizeModuleName(moduleName: string | undefined): string {
  const value = moduleName?.trim() || "app";
  return value.startsWith(":") ? value.slice(1) : value;
}

export function moduleTaskPrefix(moduleName: string): string {
  return `:${normalizeModuleName(moduleName)}:`;
}
