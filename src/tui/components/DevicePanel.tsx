import React from "react";
import { Box, Text } from "ink";
import type { AndroidDevice } from "../../types/device.js";

export function DevicePanel({ devices, selectedDevice }: { devices: AndroidDevice[]; selectedDevice?: AndroidDevice }): React.ReactElement {
  return (
    <Box borderStyle="single" flexDirection="column" paddingX={1} width="50%">
      <Text bold>Devices</Text>
      {devices.slice(0, 8).map((device) => (
        <Text key={device.id} color={device.id === selectedDevice?.id ? "green" : device.state === "device" ? undefined : "yellow"}>
          {device.id === selectedDevice?.id ? "●" : "○"} {device.model ?? device.id} {device.id !== device.model ? device.id : ""} [{device.state}]
        </Text>
      ))}
      {devices.length === 0 && <Text dimColor>No devices found.</Text>}
    </Box>
  );
}
