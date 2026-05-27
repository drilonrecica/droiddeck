import type { AndroidVariant } from "../types/variant.js";
import { taskPartToVariantName } from "../utils/casing.js";
import { moduleTaskPrefix } from "./paths.js";

type VariantTaskField = "installTask" | "assembleTask" | "unitTestTask" | "connectedTestTask";

const TASK_PATTERNS: Array<{ pattern: RegExp; field: VariantTaskField }> = [
  { pattern: /^install([A-Z][A-Za-z0-9_]*)$/, field: "installTask" },
  { pattern: /^assemble([A-Z][A-Za-z0-9_]*)$/, field: "assembleTask" },
  { pattern: /^test([A-Z][A-Za-z0-9_]*)UnitTest$/, field: "unitTestTask" },
  { pattern: /^connected([A-Z][A-Za-z0-9_]*)AndroidTest$/, field: "connectedTestTask" }
];

export function parseGradleTasks(output: string, appModule = "app"): AndroidVariant[] {
  const variants = new Map<string, AndroidVariant>();
  const taskPrefix = moduleTaskPrefix(appModule);

  for (const line of output.split(/\r?\n/)) {
    const taskName = extractTaskName(line);
    if (!taskName) {
      continue;
    }

    applyTask(taskName, taskPrefix, variants);
  }

  return [...variants.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function extractFlavorAndBuildType(variantName: string): Pick<AndroidVariant, "buildType" | "flavorName"> {
  const lowerVariant = variantName.toLowerCase();
  const buildType = ["debug", "release"].find((candidate) => lowerVariant.endsWith(candidate));

  if (!buildType) {
    return {};
  }

  const flavorName = variantName.slice(0, -buildType.length);
  return {
    buildType,
    flavorName: flavorName ? taskPartToVariantName(flavorName) : undefined
  };
}

function extractTaskName(line: string): string | undefined {
  const trimmed = line.trim();
  const match = /^([A-Za-z][A-Za-z0-9_]*)\b/.exec(trimmed);
  return match?.[1];
}

function applyTask(taskName: string, taskPrefix: string, variants: Map<string, AndroidVariant>): void {
  for (const { pattern, field } of TASK_PATTERNS) {
    const match = pattern.exec(taskName);
    if (!match) {
      continue;
    }

    const taskNamePart = match[1]!;
    const variantName = taskPartToVariantName(taskNamePart);
    const variant = variants.get(variantName) ?? createVariant(variantName, taskNamePart);
    variant[field] = `${taskPrefix}${taskName}`;
    variants.set(variantName, variant);
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

