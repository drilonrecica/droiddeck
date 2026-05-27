import { execa } from "execa";
import { runCommand } from "./processRunner.js";

export async function isAdbAvailable(): Promise<boolean> {
  try {
    const result = await execa("adb", ["version"], { reject: false });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function runAdb(args: string[], onLine?: (line: string) => void) {
  return runCommand("adb", args, { onLine });
}

export function adbDeviceArgs(deviceId: string): string[] {
  return ["-s", deviceId];
}
