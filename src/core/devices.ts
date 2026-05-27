import type { CommandRunner } from "./adb.js";
import { adbDeviceArgs, runAdb } from "./adb.js";
import type { AndroidDevice } from "../types/device.js";
import { DroidDeckError } from "../utils/errors.js";

export function parseAdbDevices(output: string): AndroidDevice[] {
  return output
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseDeviceLine);
}

export function parseDeviceLine(line: string): AndroidDevice {
  const [id = "", stateToken = "unknown"] = line.split(/\s+/, 2);
  const modelMatch = /\bmodel:([^\s]+)/.exec(line);

  return {
    id,
    state: normalizeDeviceState(stateToken),
    model: modelMatch?.[1]?.replaceAll("_", " "),
    isEmulator: id.startsWith("emulator-"),
    rawLine: line
  };
}

export async function listDevices(includeMetadata = true, commandRunner?: CommandRunner): Promise<AndroidDevice[]> {
  const result = await runAdb(["devices", "-l"], { commandRunner });
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Could not list ADB devices.", result.outputLines.slice(-10).join("\n"));
  }

  const devices = parseAdbDevices(result.stdout || result.outputLines.join("\n"));
  if (!includeMetadata) {
    return devices;
  }

  return Promise.all(
    devices.map(async (device) => {
      if (device.state !== "device") {
        return device;
      }

      const [model, androidVersion, apiLevel] = await Promise.all([
        getDeviceProp(device.id, "ro.product.model", commandRunner),
        getDeviceProp(device.id, "ro.build.version.release", commandRunner),
        getDeviceProp(device.id, "ro.build.version.sdk", commandRunner)
      ]);

      return {
        ...device,
        model: model || device.model,
        androidVersion,
        apiLevel
      };
    })
  );
}

export function resolveDevice(devices: readonly AndroidDevice[], requestedDeviceId?: string, fallbackDeviceId?: string): AndroidDevice {
  const onlineDevices = devices.filter((device) => device.state === "device");
  const selectedDeviceId = requestedDeviceId ?? fallbackDeviceId;

  if (selectedDeviceId) {
    const selectedDevice = devices.find((device) => device.id === selectedDeviceId);
    if (selectedDevice?.state === "device") {
      return selectedDevice;
    }

    throw new DroidDeckError(`Device "${selectedDeviceId}" is not connected and online.`, formatDevices(devices));
  }

  if (onlineDevices.length === 1) {
    return onlineDevices[0]!;
  }

  if (onlineDevices.length === 0) {
    throw new DroidDeckError("No online Android devices found.", "Start an emulator or connect a device, then run adb devices.");
  }

  throw new DroidDeckError("Multiple Android devices are connected.", "Select one with droiddeck device <deviceId> before running device-specific commands.");
}

export function formatDevices(devices: readonly AndroidDevice[]): string {
  if (devices.length === 0) {
    return "No devices found.";
  }

  return devices.map((device) => `- ${device.id} (${device.state})`).join("\n");
}

function normalizeDeviceState(state: string): AndroidDevice["state"] {
  if (state === "device" || state === "offline" || state === "unauthorized") {
    return state;
  }

  return "unknown";
}

async function getDeviceProp(deviceId: string, prop: string, commandRunner?: CommandRunner): Promise<string | undefined> {
  const result = await runAdb([...adbDeviceArgs(deviceId), "shell", "getprop", prop], { commandRunner });
  if (result.exitCode !== 0) {
    return undefined;
  }

  return (result.stdout || result.outputLines.join("\n")).trim() || undefined;
}

