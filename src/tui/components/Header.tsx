import React from "react";
import { Box, Text } from "ink";
import type { ProjectInfo } from "../../types/project.js";
import type { AndroidVariant } from "../../types/variant.js";
import type { AndroidDevice } from "../../types/device.js";

type Props = {
  project: ProjectInfo;
  selectedVariant?: AndroidVariant;
  selectedDevice?: AndroidDevice;
  doctorSummary: string;
};

export function Header({ project, selectedVariant, selectedDevice, doctorSummary }: Props): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1}>
      <Text bold>DroidDeck</Text>
      <Text>
        Project: {project.name}  Module: {project.appModule}  Doctor: {doctorSummary}
      </Text>
      <Text>
        Variant: {selectedVariant?.name ?? "none"}  Device: {selectedDevice?.id ?? "none"}
      </Text>
    </Box>
  );
}
