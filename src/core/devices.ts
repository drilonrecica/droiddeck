import type { AndroidDevice } from "../types/device.js";
import { runAdb, adbDeviceArgs } from "./adb.js";
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
  const [id = "", stateRaw = "unknown"] = line.split(/\s+/, 2);
  const state = normalizeDeviceState(stateRaw);
  const modelMatch = /model:([^\s]+)/.exec(line);
  return {
    id,
    state,
    model: modelMatch?.[1]?.replaceAll("_", " "),
    isEmulator: id.startsWith("emulator-"),
    rawLine: line
  };
}

function normalizeDeviceState(value: string): AndroidDevice["state"] {
  if (value === "device" || value === "offline" || value === "unauthorized") {
    return value;
  }
  return "unknown";
}

export async function listDevices(includeMetadata = true): Promise<AndroidDevice[]> {
  const result = await runAdb(["devices", "-l"]);
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
        getProp(device.id, "ro.product.model"),
        getProp(device.id, "ro.build.version.release"),
        getProp(device.id, "ro.build.version.sdk")
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

async function getProp(deviceId: string, prop: string): Promise<string | undefined> {
  const result = await runAdb([...adbDeviceArgs(deviceId), "shell", "getprop", prop]);
  if (result.exitCode !== 0) {
    return undefined;
  }
  return (result.stdout || result.outputLines.join("\n")).trim() || undefined;
}

export function resolveDevice(devices: AndroidDevice[], requested?: string, fallbackDeviceId?: string): AndroidDevice {
  const online = devices.filter((device) => device.state === "device");
  const selectedId = requested || fallbackDeviceId;
  if (selectedId) {
    const selected = devices.find((device) => device.id === selectedId);
    if (selected?.state === "device") {
      return selected;
    }
    throw new DroidDeckError(`Device "${selectedId}" is not connected and online.`, formatDevices(devices));
  }

  if (online.length === 1) {
    return online[0]!;
  }

  if (online.length === 0) {
    throw new DroidDeckError("No online Android devices found.", "Start an emulator or connect a device, then run adb devices.");
  }

  throw new DroidDeckError("Multiple Android devices are connected.", "Select one with droiddeck device <deviceId> or pass --device <deviceId>.");
}

export function formatDevices(devices: AndroidDevice[]): string {
  return devices.length
    ? devices.map((device) => `- ${device.id} (${device.state})`).join("\n")
    : "No devices found.";
}
