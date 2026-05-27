import type { CommandResult } from "../types/command.js";
import { adbDeviceArgs, runAdb } from "./adb.js";

export type AppStatus = "running" | "not running" | "unknown";

export async function getAppStatus(deviceId: string, applicationId: string, commandRunner?: (file: string, args?: readonly string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv; input?: string; reject?: boolean; onLine?: (line: string) => void; maxOutputLines?: number }) => Promise<CommandResult>): Promise<AppStatus> {
  const result = await runAdb([...adbDeviceArgs(deviceId), "shell", "pidof", applicationId], {
    commandRunner
  });

  if (result.exitCode === 0 && (result.stdout?.trim() || result.outputLines.join("\n").trim())) {
    return "running";
  }

  return "not running";
}
