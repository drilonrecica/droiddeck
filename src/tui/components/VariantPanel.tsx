import type { AndroidVariant } from "../../types/variant.js";
import { Line } from "./Line.js";

export type VariantPanelProps = {
  variants: readonly AndroidVariant[];
  selectedVariant?: AndroidVariant;
  highlightedIndex: number;
  focused: boolean;
  message?: string;
};

const maxRows = 8;

export function VariantPanel({ variants, selectedVariant, highlightedIndex, focused, message }: VariantPanelProps) {
  const windowStart = visibleWindowStart(variants.length, highlightedIndex, maxRows);
  const visible = variants.slice(windowStart, windowStart + maxRows);
  const contentRows = (message ? 1 : 0) + (visible.length === 0 ? 1 : visible.length) + (variants.length > maxRows ? 1 : 0);

  return (
    <box
      title="Variants"
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={focused ? "#38BDF8" : "#6B7280"}
      paddingX={1}
      width="50%"
      height={contentRows + 2}
    >
      {message ? <Line fg="#F59E0B">{message}</Line> : null}
      {visible.length === 0 ? <Line fg="#9CA3AF">No selectable app variants discovered.</Line> : null}
      {visible.map((variant, index) => {
        const actualIndex = windowStart + index;
        const highlighted = focused && actualIndex === highlightedIndex;
        const selected = variant.name === selectedVariant?.name;

        return (
          <Line key={variant.name} fg={highlighted ? "#38BDF8" : selected ? "#22C55E" : "#D1D5DB"} bg={highlighted ? "#0F172A" : undefined}>
            {`${highlighted ? ">" : selected ? "*" : " "} ${variant.name}${variant.buildType ? ` (${variant.buildType})` : ""}`}
          </Line>
        );
      })}
      {variants.length > maxRows ? (
        <Line fg="#9CA3AF">{`Showing ${windowStart + 1}-${Math.min(windowStart + maxRows, variants.length)} of ${variants.length}`}</Line>
      ) : null}
    </box>
  );
}

function visibleWindowStart(total: number, highlightedIndex: number, limit: number): number {
  if (total <= limit) {
    return 0;
  }

  if (highlightedIndex < 0) {
    return 0;
  }

  if (highlightedIndex >= total - limit) {
    return total - limit;
  }

  return highlightedIndex;
}
