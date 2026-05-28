import path from "node:path";
import fs from "fs-extra";
import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";
import { normalizeModuleName } from "./paths.js";

export type ApplicationIdResolutionOptions = {
  projectRoot?: string;
  appModule?: string;
};

export async function resolveApplicationId(
  config: DroidDeckConfig,
  variant: AndroidVariant,
  options: ApplicationIdResolutionOptions = {}
): Promise<string> {
  const configuredApplicationId = config.applicationIds[variant.name];
  if (configuredApplicationId) {
    return configuredApplicationId;
  }

  if (variant.applicationId) {
    return variant.applicationId;
  }

  if (options.projectRoot) {
    const inferredApplicationId = await inferApplicationIdFromGradleFiles(
      options.projectRoot,
      options.appModule ?? config.appModule,
      variant
    );
    if (inferredApplicationId) {
      return inferredApplicationId;
    }
  }

  throw missingApplicationIdError(variant.name);
}

export async function withResolvedApplicationId(
  config: DroidDeckConfig,
  variant: AndroidVariant,
  options: ApplicationIdResolutionOptions = {}
): Promise<AndroidVariant> {
  return {
    ...variant,
    applicationId: await resolveApplicationId(config, variant, options)
  };
}

export async function inferApplicationIdFromGradleFiles(
  projectRoot: string,
  appModule: string,
  variant: AndroidVariant
): Promise<string | undefined> {
  const gradleFile = await findModuleGradleFile(projectRoot, appModule);
  if (!gradleFile) {
    return undefined;
  }

  const contents = stripComments(await fs.readFile(gradleFile, "utf8"));
  const inferredParts = inferVariantParts(contents, variant);
  const flavorName = variant.flavorName ?? inferredParts.flavorName;
  const buildType = variant.buildType ?? inferredParts.buildType;
  const flavorApplicationId = flavorName ? extractApplicationId(contents, flavorName) : undefined;
  const defaultApplicationId = extractApplicationId(contents, "defaultConfig");
  const baseApplicationId = flavorApplicationId ?? defaultApplicationId;

  if (!baseApplicationId) {
    return undefined;
  }

  const suffixes = [
    flavorName ? extractApplicationIdSuffix(contents, flavorName) : undefined,
    buildType ? extractApplicationIdSuffix(contents, buildType) : undefined
  ].filter((suffix): suffix is string => Boolean(suffix));

  return `${baseApplicationId}${suffixes.join("")}`;
}

export function missingApplicationIdError(variantName: string): DroidDeckError {
  return new DroidDeckError(
    `Could not determine applicationId for variant "${variantName}".`,
    `Add this to droiddeck.config.json:\n\n{\n  "applicationIds": {\n    "${variantName}": "your.package.name"\n  }\n}`
  );
}

async function findModuleGradleFile(projectRoot: string, appModule: string): Promise<string | undefined> {
  const modulePath = path.join(projectRoot, normalizeModuleName(appModule));
  const candidates = [path.join(modulePath, "build.gradle"), path.join(modulePath, "build.gradle.kts")];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function extractApplicationId(contents: string, blockName: string): string | undefined {
  const blocks = findNamedBlocks(contents, blockName);
  if (blocks.length === 0) {
    return undefined;
  }

  const applicationIds = distinct(
    blocks
      .map((block) => extractSingleLiteral(block, /\bapplicationId\s*(?:=)?\s*["']([^"']+)["']/g))
      .filter((applicationId): applicationId is string => Boolean(applicationId))
  );

  return applicationIds.length === 1 ? applicationIds[0] : undefined;
}

function extractApplicationIdSuffix(contents: string, blockName: string): string | undefined {
  const blocks = findNamedBlocks(contents, blockName);
  if (blocks.length === 0) {
    return undefined;
  }

  const suffixes = distinct(
    blocks
      .map((block) => extractSingleLiteral(block, /\bapplicationIdSuffix\s*(?:=)?\s*["']([^"']+)["']/g))
      .filter((suffix): suffix is string => Boolean(suffix))
  );

  return suffixes.length === 1 ? suffixes[0] : undefined;
}

function inferVariantParts(contents: string, variant: AndroidVariant): Pick<AndroidVariant, "buildType" | "flavorName"> {
  const buildTypes = declaredBlockNames(contents, "buildTypes");
  const flavors = declaredBlockNames(contents, "productFlavors");
  const lowerVariantName = variant.name.toLowerCase();

  for (const buildType of buildTypes.sort((left, right) => right.length - left.length)) {
    const lowerBuildType = buildType.toLowerCase();
    if (!lowerVariantName.endsWith(lowerBuildType)) {
      continue;
    }

    const flavorPart = variant.name.slice(0, variant.name.length - buildType.length);
    if (!flavorPart) {
      return { buildType };
    }

    const flavorName = flavors.find((flavor) => flavor.toLowerCase() === flavorPart.toLowerCase());
    if (flavorName) {
      return { buildType, flavorName };
    }
  }

  return {};
}

function declaredBlockNames(contents: string, containerName: string): string[] {
  const containerBlocks = findNamedBlocks(contents, containerName);
  const names = new Set<string>();

  for (const block of containerBlocks) {
    for (const match of block.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9_]*)\s*\{/g)) {
      const name = match[1];
      if (name) {
        names.add(name);
      }
    }

    for (const match of block.matchAll(/\b(?:create|getByName|maybeCreate|named)\(\s*["']([^"']+)["']\s*\)\s*\{/g)) {
      const name = match[1];
      if (name) {
        names.add(name);
      }
    }
  }

  return [...names];
}

function extractSingleLiteral(contents: string, pattern: RegExp): string | undefined {
  const values = distinct([...contents.matchAll(pattern)].map((match) => match[1]).filter((value): value is string => Boolean(value)));
  return values.length === 1 ? values[0] : undefined;
}

function findNamedBlocks(contents: string, name: string): string[] {
  const nameAlternatives = distinct([name, upperFirst(name), lowerFirst(name)]).map(escapeRegExp).join("|");
  const patterns = [
    new RegExp(`(^|[\\s{])(?:${nameAlternatives})\\s*\\{`, "g"),
    new RegExp(`\\b(?:create|getByName|maybeCreate|named)\\(\\s*["'](?:${nameAlternatives})["']\\s*\\)\\s*\\{`, "g")
  ];
  const blocks: string[] = [];

  for (const pattern of patterns) {
    for (const match of contents.matchAll(pattern)) {
      const openBraceIndex = contents.indexOf("{", match.index ?? 0);
      const block = readBraceBlock(contents, openBraceIndex);
      if (block) {
        blocks.push(block);
      }
    }
  }

  return blocks;
}

function readBraceBlock(contents: string, openBraceIndex: number): string | undefined {
  if (openBraceIndex < 0 || contents[openBraceIndex] !== "{") {
    return undefined;
  }

  let depth = 0;
  for (let index = openBraceIndex; index < contents.length; index += 1) {
    const char = contents[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return contents.slice(openBraceIndex + 1, index);
      }
    }
  }

  return undefined;
}

function stripComments(contents: string): string {
  return contents.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upperFirst(value: string): string {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value;
}

function lowerFirst(value: string): string {
  return value ? `${value[0]?.toLowerCase()}${value.slice(1)}` : value;
}
