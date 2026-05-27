import type { DroidDeckConfig } from "../types/config.js";
import { DroidDeckError } from "../utils/errors.js";
import { adbDeviceArgs, runAdb } from "./adb.js";

export function clearAppDataArgs(deviceId: string, applicationId: string): string[] {
  return [...adbDeviceArgs(deviceId), "shell", "pm", "clear", applicationId];
}

export function killAppArgs(deviceId: string, applicationId: string): string[] {
  return [...adbDeviceArgs(deviceId), "shell", "am", "force-stop", applicationId];
}

export function uninstallAppArgs(deviceId: string, applicationId: string): string[] {
  return [...adbDeviceArgs(deviceId), "uninstall", applicationId];
}

export function launchAppArgs(config: DroidDeckConfig, deviceId: string, applicationId: string): string[] {
  if (config.actions.launchMode === "activity") {
    if (!config.mainActivity) {
      throw new DroidDeckError("Cannot launch with activity mode because mainActivity is not configured.");
    }
    return [...adbDeviceArgs(deviceId), "shell", "am", "start", "-n", `${applicationId}/${config.mainActivity}`];
  }

  return [...adbDeviceArgs(deviceId), "shell", "monkey", "-p", applicationId, "1"];
}

export async function clearAppData(deviceId: string, applicationId: string): Promise<void> {
  await assertAdbSuccess(clearAppDataArgs(deviceId, applicationId), "Clear app data failed.");
}

export async function launchApp(config: DroidDeckConfig, deviceId: string, applicationId: string): Promise<void> {
  await assertAdbSuccess(launchAppArgs(config, deviceId, applicationId), "Launch failed.");
}

export async function killApp(deviceId: string, applicationId: string): Promise<void> {
  await assertAdbSuccess(killAppArgs(deviceId, applicationId), "Kill app failed.");
}

export async function uninstallApp(deviceId: string, applicationId: string): Promise<void> {
  await assertAdbSuccess(uninstallAppArgs(deviceId, applicationId), "Uninstall failed.");
}

async function assertAdbSuccess(args: readonly string[], message: string): Promise<void> {
  const result = await runAdb(args);
  if (result.exitCode !== 0) {
    throw new DroidDeckError(message, result.outputLines.slice(-10).join("\n"));
  }
}

