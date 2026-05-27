import { Box, Text } from "ink";
import type { AndroidVariant } from "../../types/variant.js";

export type VariantPanelProps = {
  variants: readonly AndroidVariant[];
  selectedVariant?: AndroidVariant;
};

export function VariantPanel({ variants, selectedVariant }: VariantPanelProps): JSX.Element {
  const visible = variants.slice(0, 8);

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} width="50%">
      <Text bold>Variants</Text>
      {visible.length === 0 ? <Text dimColor>No variants discovered.</Text> : null}
      {visible.map((variant) => (
        <Text key={variant.name} color={variant.name === selectedVariant?.name ? "green" : undefined}>
          {variant.name === selectedVariant?.name ? "> " : "  "}
          {variant.name}
          {variant.buildType ? ` (${variant.buildType})` : ""}
        </Text>
      ))}
    </Box>
  );
}
