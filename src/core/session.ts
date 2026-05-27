import { resolveApplicationId } from "./appIdResolver.js";
import { loadConfig } from "./config.js";
import { listDevices, resolveDevice } from "./devices.js";
import { loadGradleTasks } from "./gradle.js";
import { getProjectPreferences, loadPreferences, type ProjectPreferences } from "./preferences.js";
import { findProjectRoot, getProjectInfo } from "./projectDetector.js";
import { parseGradleTasks } from "./variantDiscovery.js";
import { resolveVariant } from "./variantResolver.js";
import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidDevice } from "../types/device.js";
import type { ProjectInfo } from "../types/project.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export type ProjectSession = {
  projectRoot: string;
  project: ProjectInfo;
  config: DroidDeckConfig;
  preferences: ProjectPreferences;
  variants: AndroidVariant[];
};

export async function loadProjectSession(startDir?: string): Promise<ProjectSession> {
  const projectRoot = await findProjectRoot(startDir);
  if (!projectRoot) {
    throw new DroidDeckError("Android project root not found.", "Run DroidDeck from an Android project directory.");
  }

  const { config } = await loadConfig(projectRoot);
  const project = await getProjectInfo(projectRoot, config.appModule, config.projectName);
  const preferences = getProjectPreferences(await loadPreferences(), projectRoot);
  const tasksOutput = await loadGradleTasks(projectRoot, config.appModule);
  const variants = parseGradleTasks(tasksOutput, config.appModule);

  return {
    projectRoot,
    project,
    config,
    preferences,
    variants
  };
}

export function resolveSessionVariant(session: ProjectSession, variantOrAlias?: string): AndroidVariant {
  return resolveVariant(session.variants, session.config.variantAliases, variantOrAlias, session.preferences.lastVariant);
}

export async function resolveSessionDevice(session: ProjectSession, deviceId?: string): Promise<AndroidDevice> {
  return resolveDevice(await listDevices(), deviceId, session.preferences.lastDeviceId);
}

export async function resolveSessionApplicationId(session: ProjectSession, variant: AndroidVariant): Promise<string> {
  return resolveApplicationId(session.config, variant, {
    projectRoot: session.projectRoot,
    appModule: session.config.appModule
  });
}
