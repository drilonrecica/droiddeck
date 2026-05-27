import type { CommandResult } from "../types/command.js";
import { runCommand } from "./processRunner.js";

export type CommandRunner = typeof runCommand;

export type AdbCommandOptions = {
  commandRunner?: CommandRunner;
  onLine?: (line: string) => void;
};

export async function isAdbAvailable(commandRunner: CommandRunner = runCommand): Promise<boolean> {
  try {
    const result = await commandRunner("adb", ["version"]);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

export async function runAdb(args: readonly string[], options: AdbCommandOptions = {}): Promise<CommandResult> {
  return (options.commandRunner ?? runCommand)("adb", args, { onLine: options.onLine });
}

export function adbDeviceArgs(deviceId: string): string[] {
  return ["-s", deviceId];
}

