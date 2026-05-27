import React from "react";
import { Box, Text } from "ink";
import type { AndroidVariant } from "../../types/variant.js";

export function VariantPanel({ variants, selectedVariant }: { variants: AndroidVariant[]; selectedVariant?: AndroidVariant }): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1} width="50%">
      <Text bold>Variants</Text>
      {variants.slice(0, 8).map((variant) => (
        <Text key={variant.name} color={variant.name === selectedVariant?.name ? "green" : undefined}>
          {variant.name === selectedVariant?.name ? "●" : "○"} {variant.name}
        </Text>
      ))}
      {variants.length === 0 && <Text dimColor>No variants discovered.</Text>}
    </Box>
  );
}
