import path from "node:path";
import fs from "fs-extra";
import type { AndroidDevice } from "../types/device.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";
import { timestampForFilename } from "../utils/time.js";
import { adbDeviceArgs } from "./adb.js";
import { screenshotsDir } from "./paths.js";
import { runCommandBinary } from "./processRunner.js";

export function buildScreenshotPath(projectRoot: string, device: AndroidDevice, variant?: AndroidVariant, date = new Date()): string {
  const variantName = sanitizeFilenamePart(variant?.name ?? "device");
  const deviceId = sanitizeFilenamePart(device.id);
  return path.join(screenshotsDir(projectRoot), `screenshot-${variantName}-${deviceId}-${timestampForFilename(date)}.png`);
}

export async function captureScreenshot(projectRoot: string, device: AndroidDevice, variant?: AndroidVariant): Promise<string> {
  const filePath = buildScreenshotPath(projectRoot, device, variant);
  const result = await runCommandBinary("adb", [...adbDeviceArgs(device.id), "exec-out", "screencap", "-p"]);

  if (result.exitCode !== 0) {
    throw new DroidDeckError(`Screenshot failed for device "${device.id}".`, result.outputLines.slice(-10).join("\n"));
  }

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, result.stdout);
  return filePath;
}

function sanitizeFilenamePart(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/g, "_");
}

