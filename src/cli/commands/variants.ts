import { loadCommandContext } from "../context.js";

export async function runVariantsCommand(): Promise<void> {
  const { variants, config } = await loadCommandContext();
  const aliasesByTarget = new Map(Object.entries(config.variantAliases).map(([alias, target]) => [target, alias]));

  for (const variant of variants) {
    const parts = [
      variant.name,
      variant.buildType ? `buildType=${variant.buildType}` : undefined,
      variant.flavorName ? `flavor=${variant.flavorName}` : undefined,
      variant.installTask ? "install=yes" : "install=no",
      variant.unitTestTask ? "unitTest=yes" : "unitTest=no",
      aliasesByTarget.has(variant.name) ? `alias=${aliasesByTarget.get(variant.name)}` : undefined
    ].filter(Boolean);
    console.log(parts.join("  "));
  }
}
