import type { AndroidVariant } from "../types/variant.js";

export type InitialVariantSelection =
  | { status: "selected"; variant: AndroidVariant; selectableVariants: AndroidVariant[] }
  | { status: "needs-selection"; selectableVariants: AndroidVariant[] }
  | { status: "empty"; selectableVariants: AndroidVariant[]; message: string };

export function getSelectableAppVariants(variants: readonly AndroidVariant[]): AndroidVariant[] {
  const hasFlavoredVariants = variants.some((variant) => Boolean(variant.flavorName));

  return variants.filter((variant) => {
    if (!variant.buildType || isTestVariantName(variant.name)) {
      return false;
    }

    if (!variant.installTask && !variant.assembleTask) {
      return false;
    }

    if (hasFlavoredVariants && !variant.flavorName) {
      return false;
    }

    return true;
  });
}

export function resolveInitialVariantSelection(
  variants: readonly AndroidVariant[],
  persistedVariantName?: string
): InitialVariantSelection {
  const selectableVariants = getSelectableAppVariants(variants);

  if (persistedVariantName) {
    const persisted = selectableVariants.find((variant) => variant.name === persistedVariantName);
    if (persisted) {
      return { status: "selected", variant: persisted, selectableVariants };
    }
  }

  if (selectableVariants.length === 1) {
    return { status: "selected", variant: selectableVariants[0]!, selectableVariants };
  }

  if (selectableVariants.length > 1) {
    return { status: "needs-selection", selectableVariants };
  }

  return {
    status: "empty",
    selectableVariants,
    message: "No selectable app variants were discovered."
  };
}

function isTestVariantName(name: string): boolean {
  const lowerName = name.toLowerCase();
  return lowerName === "androidtest" || lowerName === "unittest" || lowerName.endsWith("androidtest") || lowerName.endsWith("unittest");
}
