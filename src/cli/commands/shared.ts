import { resolveApplicationId } from "../../core/appIdResolver.js";
import { adbDeviceArgs, runAdb } from "../../core/adb.js";
import { listDevices, resolveDevice } from "../../core/devices.js";
import { runGradleTask } from "../../core/gradle.js";
import { findPid, parseLogLine, shouldShowLogLine } from "../../core/logcat.js";
import { updateProjectPreferences } from "../../core/preferences.js";
import { resolveVariant } from "../../core/variantResolver.js";
import type { LogMode } from "../../types/config.js";
import type { AndroidDevice } from "../../types/device.js";
import type { AndroidVariant } from "../../types/variant.js";
import { DroidDeckError } from "../../utils/errors.js";
import { loadCommandContext, type CommandContext } from "../context.js";

export type ResolvedSelection = {
  context: CommandContext;
  variant: AndroidVariant;
  device: AndroidDevice;
};

export async function resolveSelection(variantInput?: string, deviceInput?: string): Promise<ResolvedSelection> {
  const context = await loadCommandContext();
  const variant = resolveVariant(context.variants, context.config.variantAliases, variantInput, context.preferences.lastVariant);
  const devices = await listDevices();
  const device = resolveDevice(devices, deviceInput, context.preferences.lastDeviceId);
  await updateProjectPreferences(context.projectRoot, { lastVariant: variant.name, lastDeviceId: device.id });
  return { context, variant, device };
}

export async function installVariant(context: CommandContext, variant: AndroidVariant, clean = false): Promise<{ installed: boolean }> {
  if (clean) {
    console.log("Running Gradle clean...");
    const cleanResult = await runGradleTask(context.projectRoot, ["clean"], (line) => console.log(line));
    if (cleanResult.exitCode !== 0) {
      throw new DroidDeckError("Gradle clean failed.", cleanResult.outputLines.slice(-20).join("\n"));
    }
  }

  const task = variant.installTask ?? variant.assembleTask;
  if (!task) {
    throw new DroidDeckError(`No install or assemble task found for variant "${variant.name}".`);
  }

  console.log(`Running ${task}...`);
  const result = await runGradleTask(context.projectRoot, [task], (line) => console.log(line));
  if (result.exitCode !== 0) {
    throw new DroidDeckError(`Gradle task failed: ${task}`, result.outputLines.slice(-20).join("\n"));
  }

  if (!variant.installTask && variant.assembleTask) {
    console.log("Variant assembled, but no install task was found.");
    return { installed: false };
  }

  return { installed: true };
}

export async function clearApp(device: AndroidDevice, applicationId: string): Promise<void> {
  const result = await runAdb([...adbDeviceArgs(device.id), "shell", "pm", "clear", applicationId]);
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Clear app data failed.", result.outputLines.slice(-10).join("\n"));
  }
}

export async function launchApp(context: CommandContext, device: AndroidDevice, applicationId: string): Promise<void> {
  const args =
    context.config.actions.launchMode === "activity"
      ? [...adbDeviceArgs(device.id), "shell", "am", "start", "-n", `${applicationId}/${context.config.mainActivity}`]
      : [...adbDeviceArgs(device.id), "shell", "monkey", "-p", applicationId, "1"];
  const result = await runAdb(args);
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Launch failed.", result.outputLines.slice(-10).join("\n"));
  }
}

export async function killApp(device: AndroidDevice, applicationId: string): Promise<void> {
  const result = await runAdb([...adbDeviceArgs(device.id), "shell", "am", "force-stop", applicationId]);
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Kill app failed.", result.outputLines.slice(-10).join("\n"));
  }
}

export async function uninstallApp(device: AndroidDevice, applicationId: string): Promise<void> {
  const result = await runAdb([...adbDeviceArgs(device.id), "uninstall", applicationId]);
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Uninstall failed.", result.outputLines.slice(-10).join("\n"));
  }
}

export function applicationIdForSelection(context: CommandContext, variant: AndroidVariant): string {
  return resolveApplicationId(context.config, variant);
}

export async function streamLogs(device: AndroidDevice, applicationId: string | undefined, mode: LogMode): Promise<void> {
  const pid = applicationId ? await findPid(device.id, applicationId) : undefined;
  if (applicationId && !pid) {
    console.error(`Warning: app process not running for ${applicationId}; falling back to priority filtering.`);
  }

  await runAdb([...adbDeviceArgs(device.id), "logcat", "-v", "threadtime"], (raw) => {
    const line = parseLogLine(raw);
    if (pid && line.pid !== pid) {
      return;
    }
    if (shouldShowLogLine(line, mode)) {
      console.log(line.raw);
    }
  });
}
