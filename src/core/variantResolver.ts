import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export function resolveVariant(
  variants: AndroidVariant[],
  aliases: Record<string, string>,
  input?: string,
  fallbackVariant?: string
): AndroidVariant {
  const requested = input || fallbackVariant;
  if (!requested) {
    if (variants.length === 1) {
      return variants[0]!;
    }
    throw new DroidDeckError("No variant selected.", formatAvailableVariants(variants, aliases));
  }

  const exact = variants.find((variant) => variant.name === requested);
  if (exact) {
    return exact;
  }

  const aliasTarget = aliases[requested];
  if (aliasTarget) {
    const resolved = variants.find((variant) => variant.name === aliasTarget);
    if (resolved) {
      return resolved;
    }
    throw new DroidDeckError(`Variant alias "${requested}" points to missing variant "${aliasTarget}".`, formatAvailableVariants(variants, aliases));
  }

  const caseInsensitive = variants.find((variant) => variant.name.toLowerCase() === requested.toLowerCase());
  if (caseInsensitive) {
    return caseInsensitive;
  }

  throw new DroidDeckError(`Unknown variant "${requested}".`, formatAvailableVariants(variants, aliases));
}

export function formatAvailableVariants(variants: AndroidVariant[], aliases: Record<string, string>): string {
  const variantList = variants.map((variant) => `- ${variant.name}`).join("\n") || "- none discovered";
  const aliasEntries = Object.entries(aliases);
  const aliasList = aliasEntries.length
    ? `\n\nAliases:\n${aliasEntries.map(([alias, target]) => `- ${alias} -> ${target}`).join("\n")}`
    : "";
  return `Available variants:\n${variantList}${aliasList}`;
}
