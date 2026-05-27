import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export function resolveVariant(
  variants: readonly AndroidVariant[],
  aliases: Readonly<Record<string, string>>,
  input: string | undefined,
  fallbackVariant?: string
): AndroidVariant {
  const requested = input ?? fallbackVariant;

  if (!requested) {
    if (variants.length === 1) {
      return variants[0]!;
    }

    throw new DroidDeckError("No variant selected.", formatAvailableVariants(variants, aliases));
  }

  const exactMatch = variants.find((variant) => variant.name === requested);
  if (exactMatch) {
    return exactMatch;
  }

  const aliasTarget = aliases[requested];
  if (aliasTarget) {
    const aliasMatch = variants.find((variant) => variant.name === aliasTarget);
    if (aliasMatch) {
      return aliasMatch;
    }

    throw new DroidDeckError(`Variant alias "${requested}" points to missing variant "${aliasTarget}".`, formatAvailableVariants(variants, aliases));
  }

  const caseInsensitiveMatch = variants.find((variant) => variant.name.toLowerCase() === requested.toLowerCase());
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch;
  }

  throw new DroidDeckError(`Unknown variant "${requested}".`, formatAvailableVariants(variants, aliases));
}

export function formatAvailableVariants(variants: readonly AndroidVariant[], aliases: Readonly<Record<string, string>>): string {
  const variantLines = variants.length > 0 ? variants.map((variant) => `- ${variant.name}`).join("\n") : "- none discovered";
  const aliasEntries = Object.entries(aliases);
  const aliasLines =
    aliasEntries.length > 0 ? `\n\nAliases:\n${aliasEntries.map(([alias, target]) => `- ${alias} -> ${target}`).join("\n")}` : "";

  return `Available variants:\n${variantLines}${aliasLines}`;
}

