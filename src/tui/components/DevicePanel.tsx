import { Box, Text } from "ink";
import type { AndroidDevice } from "../../types/device.js";

export type DevicePanelProps = {
  devices: readonly AndroidDevice[];
  selectedDevice?: AndroidDevice;
  deviceError?: string;
};

export function DevicePanel({ devices, selectedDevice, deviceError }: DevicePanelProps): JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} width="50%">
      <Text bold>Device</Text>
      {deviceError ? <Text color="yellow">{deviceError}</Text> : null}
      {devices.length === 0 ? <Text dimColor>No devices found.</Text> : null}
      {devices.slice(0, 8).map((device) => (
        <Text key={device.id} color={device.id === selectedDevice?.id ? "green" : device.state === "device" ? undefined : "yellow"}>
          {device.id === selectedDevice?.id ? "> " : "  "}
          {device.model ?? device.id} {device.apiLevel ? `API ${device.apiLevel}` : ""} [{device.state}]
        </Text>
      ))}
    </Box>
  );
}
