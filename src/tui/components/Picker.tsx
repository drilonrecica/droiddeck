import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

export type PickerItem = {
  label: string;
  value: string;
};

export type PickerProps = {
  title: string;
  items: readonly PickerItem[];
  emptyMessage: string;
  onSelect: (value: string) => void;
};

export function Picker({ title, items, emptyMessage, onSelect }: PickerProps): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold>{title}</Text>
      {items.length === 0 ? <Text dimColor>{emptyMessage}</Text> : <SelectInput items={[...items]} onSelect={(item) => onSelect(item.value)} />}
    </Box>
  );
}
