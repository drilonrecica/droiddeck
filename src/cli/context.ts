import { findProjectRoot, getProjectInfo } from "../core/projectDetector.js";
import { loadConfig } from "../core/config.js";
import { loadPreferences, getProjectPreferences } from "../core/preferences.js";
import { loadGradleTasks } from "../core/gradle.js";
import { parseGradleTasks } from "../core/variantDiscovery.js";
import type { ProjectInfo } from "../types/project.js";
import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export type CommandContext = {
  projectRoot: string;
  project: ProjectInfo;
  config: DroidDeckConfig;
  variants: AndroidVariant[];
  preferences: ReturnType<typeof getProjectPreferences>;
};

export async function loadCommandContext(): Promise<CommandContext> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    throw new DroidDeckError("Android project root not found.", "Run DroidDeck from an Android project directory.");
  }

  const { config } = await loadConfig(projectRoot);
  const project = await getProjectInfo(projectRoot, config.appModule, config.projectName);
  const preferencesFile = await loadPreferences();
  const preferences = getProjectPreferences(preferencesFile, projectRoot);
  const tasks = await loadGradleTasks(projectRoot, config.appModule);
  const variants = parseGradleTasks(tasks, config.appModule).map((variant) => ({
    ...variant,
    applicationId: config.applicationIds[variant.name]
  }));

  return { projectRoot, project, config, variants, preferences };
}
