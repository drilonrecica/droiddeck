import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

type Item = {
  label: string;
  value: string;
};

export function Picker({ title, items, onSelect }: { title: string; items: Item[]; onSelect: (value: string) => void }): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <SelectInput items={items} onSelect={(item) => onSelect(item.value)} />
    </Box>
  );
}
