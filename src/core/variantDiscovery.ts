import type { AndroidVariant } from "../types/variant.js";
import { taskPartToVariantName } from "../utils/casing.js";
import { moduleTaskPrefix } from "./paths.js";

type MutableVariant = AndroidVariant;

export function parseGradleTasks(output: string, appModule = "app"): AndroidVariant[] {
  const variants = new Map<string, MutableVariant>();
  const prefix = moduleTaskPrefix(appModule);

  for (const line of output.split(/\r?\n/)) {
    const taskName = extractTaskName(line);
    if (!taskName) {
      continue;
    }

    applyTask(taskName, prefix, variants);
  }

  return [...variants.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function extractTaskName(line: string): string | undefined {
  const trimmed = line.trim();
  const match = /^([A-Za-z][A-Za-z0-9_]*)\b/.exec(trimmed);
  return match?.[1];
}

function applyTask(taskName: string, prefix: string, variants: Map<string, MutableVariant>): void {
  const definitions: Array<[RegExp, keyof AndroidVariant]> = [
    [/^install([A-Z][A-Za-z0-9_]*)$/, "installTask"],
    [/^assemble([A-Z][A-Za-z0-9_]*)$/, "assembleTask"],
    [/^test([A-Z][A-Za-z0-9_]*)UnitTest$/, "unitTestTask"],
    [/^connected([A-Z][A-Za-z0-9_]*)AndroidTest$/, "connectedTestTask"]
  ];

  for (const [regex, field] of definitions) {
    const match = regex.exec(taskName);
    if (!match) {
      continue;
    }

    const taskNamePart = match[1]!;
    const name = taskPartToVariantName(taskNamePart);
    const variant = variants.get(name) ?? createVariant(name, taskNamePart);
    variant[field] = `${prefix}${taskName}` as never;
    variants.set(name, variant);
    return;
  }
}

function createVariant(name: string, taskNamePart: string): AndroidVariant {
  const { buildType, flavorName } = extractFlavorAndBuildType(name);
  return {
    name,
    taskNamePart,
    buildType,
    flavorName
  };
}

export function extractFlavorAndBuildType(variantName: string): Pick<AndroidVariant, "buildType" | "flavorName"> {
  const knownBuildTypes = ["debug", "release"];
  const lowerVariant = variantName.toLowerCase();
  const buildType = knownBuildTypes.find((candidate) => lowerVariant.endsWith(candidate));
  if (!buildType) {
    return {};
  }

  const flavorName = variantName.slice(0, -buildType.length);
  return {
    buildType,
    flavorName: flavorName ? taskPartToVariantName(flavorName) : undefined
  };
}
