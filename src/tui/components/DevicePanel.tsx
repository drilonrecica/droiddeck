import type { AndroidDevice } from "../../types/device.js";
import { Line } from "./Line.js";

export type DevicePanelProps = {
  devices: readonly AndroidDevice[];
  selectedDevice?: AndroidDevice;
  highlightedDevice?: AndroidDevice;
  focused: boolean;
  deviceError?: string;
};

const maxRows = 8;

export function DevicePanel({ devices, selectedDevice, highlightedDevice, focused, deviceError }: DevicePanelProps) {
  const highlightedIndex = highlightedDevice ? devices.findIndex((device) => device.id === highlightedDevice.id) : 0;
  const windowStart = visibleWindowStart(devices.length, highlightedIndex, maxRows);
  const visible = devices.slice(windowStart, windowStart + maxRows);
  const contentRows = (deviceError ? 1 : 0) + (devices.length === 0 ? 1 : visible.length) + (devices.length > maxRows ? 1 : 0);

  return (
    <box
      title="Device"
      flexDirection="column"
      border
      borderStyle="rounded"
      borderColor={focused ? "#38BDF8" : "#6B7280"}
      paddingX={1}
      width="50%"
      height={contentRows + 2}
    >
      {deviceError ? <Line fg="#F59E0B">{deviceError}</Line> : null}
      {devices.length === 0 ? <Line fg="#9CA3AF">No devices found.</Line> : null}
      {visible.map((device) => {
        const highlighted = focused && device.id === highlightedDevice?.id;
        const selected = device.id === selectedDevice?.id;
        const fg = highlighted ? "#38BDF8" : selected ? "#22C55E" : device.state === "device" ? "#D1D5DB" : "#F59E0B";

        return (
          <Line key={device.id} fg={fg} bg={highlighted ? "#0F172A" : undefined}>
            {`${highlighted ? ">" : selected ? "*" : " "} ${device.model ?? device.id} ${device.apiLevel ? `API ${device.apiLevel}` : ""} [${device.state}]`}
          </Line>
        );
      })}
      {devices.length > maxRows ? (
        <Line fg="#9CA3AF">{`Showing ${windowStart + 1}-${Math.min(windowStart + maxRows, devices.length)} of ${devices.length}`}</Line>
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
