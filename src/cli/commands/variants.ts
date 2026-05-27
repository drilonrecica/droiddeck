import { loadCommandContext } from "../context.js";

export async function variantsCommand(): Promise<void> {
  const { config, variants } = await loadCommandContext();
  const aliasesByTarget = new Map<string, string[]>();

  for (const [alias, target] of Object.entries(config.variantAliases)) {
    aliasesByTarget.set(target, [...(aliasesByTarget.get(target) ?? []), alias]);
  }

  for (const variant of variants) {
    const aliases = aliasesByTarget.get(variant.name);
    console.log(
      [
        variant.name,
        variant.buildType ? `buildType=${variant.buildType}` : undefined,
        variant.flavorName ? `flavor=${variant.flavorName}` : undefined,
        variant.installTask ? "install=yes" : "install=no",
        variant.unitTestTask ? "unitTest=yes" : "unitTest=no",
        aliases?.length ? `aliases=${aliases.join(",")}` : undefined
      ]
        .filter(Boolean)
        .join("  ")
    );
  }
}

