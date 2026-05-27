import fs from "fs-extra";
import { z } from "zod";
import type { DroidDeckConfig } from "../types/config.js";
import { repoConfigPath, normalizeModuleName } from "./paths.js";

const configSchema = z
  .object({
    projectName: z.string().min(1).optional(),
    appModule: z.string().min(1).optional(),
    variantAliases: z.record(z.string().min(1)).optional(),
    applicationIds: z.record(z.string().min(1)).optional(),
    mainActivity: z.string().min(1).optional(),
    logcat: z
      .object({
        defaultMode: z.enum(["errors", "warnings", "all"]).optional(),
        tags: z.array(z.string().min(1)).optional()
      })
      .optional(),
    actions: z
      .object({
        launchMode: z.enum(["monkey", "activity"]).optional()
      })
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

export type RawDroidDeckConfig = z.infer<typeof configSchema>;

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

export function parseConfig(raw: unknown): DroidDeckConfig {
  const parsed = configSchema.parse(raw);
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
  const path = repoConfigPath(projectRoot);
  if (!(await fs.pathExists(path))) {
    return { config: defaultConfig() };
  }

  const raw = await fs.readJson(path);
  return { config: parseConfig(raw), path };
}
