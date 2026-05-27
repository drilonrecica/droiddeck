import { updateProjectPreferences } from "../../core/preferences.js";
import { loadCommandContext } from "../context.js";
import { resolveVariant } from "../../core/variantResolver.js";

export async function useCommand(variantOrAlias: string): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveVariant(context.variants, context.config.variantAliases, variantOrAlias);
  await updateProjectPreferences(context.projectRoot, { lastVariant: variant.name });
  console.log(`Selected variant: ${variant.name}`);
}

