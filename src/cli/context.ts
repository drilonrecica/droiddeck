import { resolveApplicationId } from "../core/appIdResolver.js";
import { loadConfig } from "../core/config.js";
import { listDevices, resolveDevice } from "../core/devices.js";
import { loadGradleTasks } from "../core/gradle.js";
import { getProjectPreferences, loadPreferences, type ProjectPreferences } from "../core/preferences.js";
import { findProjectRoot, getProjectInfo } from "../core/projectDetector.js";
import { parseGradleTasks } from "../core/variantDiscovery.js";
import { resolveVariant } from "../core/variantResolver.js";
import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidDevice } from "../types/device.js";
import type { ProjectInfo } from "../types/project.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export type CommandContext = {
  projectRoot: string;
  project: ProjectInfo;
  config: DroidDeckConfig;
  preferences: ProjectPreferences;
  variants: AndroidVariant[];
};

export async function loadCommandContext(): Promise<CommandContext> {
  const projectRoot = await findProjectRoot();
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

export function resolveContextVariant(context: CommandContext, variantOrAlias?: string): AndroidVariant {
  return resolveVariant(context.variants, context.config.variantAliases, variantOrAlias, context.preferences.lastVariant);
}

export async function resolveContextDevice(context: CommandContext, deviceId?: string): Promise<AndroidDevice> {
  return resolveDevice(await listDevices(), deviceId, context.preferences.lastDeviceId);
}

export async function resolveContextApplicationId(context: CommandContext, variant: AndroidVariant): Promise<string> {
  return resolveApplicationId(context.config, variant, {
    projectRoot: context.projectRoot,
    appModule: context.config.appModule
  });
}

