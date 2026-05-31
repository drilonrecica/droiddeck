import type { SelectOption } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { Line } from "./Line.js";

export type PickerItem = {
  label: string;
  value: string;
};

export type PickerProps = {
  title: string;
  items: readonly PickerItem[];
  emptyMessage: string;
  onSelect: (value: string) => void;
  onCancel: () => void;
  onQuit: () => void;
};

export function Picker({ title, items, emptyMessage, onSelect, onCancel, onQuit }: PickerProps) {
  const options: SelectOption[] = items.map((item) => ({
    name: item.label,
    description: "",
    value: item.value
  }));
  const selectHeight = Math.min(Math.max(items.length, 3), 14);
  const contentRows = items.length === 0 ? 2 : selectHeight + 1;

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (key.name === "escape") {
      key.preventDefault();
      onCancel();
    } else if (key.name === "q" || key.raw === "q" || key.sequence === "q") {
      key.preventDefault();
      onQuit();
    }
  });

  return (
    <box title={title} flexDirection="column" border borderStyle="rounded" paddingX={1} height={contentRows + 2}>
      {items.length === 0 ? (
        <Line fg="#9CA3AF">{emptyMessage}</Line>
      ) : (
        <select
          focused
          height={selectHeight}
          options={options}
          showDescription={false}
          showScrollIndicator
          wrapSelection
          selectedTextColor="#22C55E"
          selectedBackgroundColor="#111827"
          textColor="#D1D5DB"
          onSelect={(_, option) => {
            if (typeof option?.value === "string") {
              onSelect(option.value);
            }
          }}
        />
      )}
      <Line fg="#9CA3AF">Use up/down or j/k, enter to select, escape to return, q to quit.</Line>
    </box>
  );
}
