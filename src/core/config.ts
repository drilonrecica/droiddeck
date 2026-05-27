import fs from "fs-extra";
import { z } from "zod";
import type { DroidDeckConfig } from "../types/config.js";
import { normalizeModuleName, repoConfigPath } from "./paths.js";

const rawConfigSchema = z
  .object({
    projectName: z.string().min(1).optional(),
    appModule: z.string().min(1).optional(),
    variantAliases: z.record(z.string().min(1), z.string().min(1)).optional(),
    applicationIds: z.record(z.string().min(1), z.string().min(1)).optional(),
    mainActivity: z.string().min(1).optional(),
    logcat: z
      .object({
        defaultMode: z.enum(["errors", "warnings", "all"]).optional(),
        tags: z.array(z.string().min(1)).optional()
      })
      .strict()
      .optional(),
    actions: z
      .object({
        launchMode: z.enum(["monkey", "activity"]).optional()
      })
      .strict()
      .optional()
  })
  .strict()
  .superRefine((config, context) => {
    if (config.actions?.launchMode === "activity" && !config.mainActivity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mainActivity"],
        message: "mainActivity is required when actions.launchMode is activity"
      });
    }
  });

export function defaultConfig(): DroidDeckConfig {
  return {
    appModule: "app",
    variantAliases: {},
    applicationIds: {},
    logcat: {
      defaultMode: "warnings",
      tags: []
    },
    actions: {
      launchMode: "monkey"
    }
  };
}

export function parseConfig(value: unknown): DroidDeckConfig {
  const parsed = rawConfigSchema.parse(value);

  return {
    projectName: parsed.projectName,
    appModule: normalizeModuleName(parsed.appModule),
    variantAliases: parsed.variantAliases ?? {},
    applicationIds: parsed.applicationIds ?? {},
    mainActivity: parsed.mainActivity,
    logcat: {
      defaultMode: parsed.logcat?.defaultMode ?? "warnings",
      tags: parsed.logcat?.tags ?? []
    },
    actions: {
      launchMode: parsed.actions?.launchMode ?? "monkey"
    }
  };
}

export async function loadConfig(projectRoot: string): Promise<{ config: DroidDeckConfig; path?: string }> {
  const configPath = repoConfigPath(projectRoot);
  if (!(await fs.pathExists(configPath))) {
    return { config: defaultConfig() };
  }

  const raw = await fs.readJson(configPath);
  return {
    config: parseConfig(raw),
    path: configPath
  };
}

