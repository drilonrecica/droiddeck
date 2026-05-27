import fs from "fs-extra";
import path from "node:path";
import type { AndroidDevice } from "../types/device.js";
import type { AndroidVariant } from "../types/variant.js";
import { screenshotsDir } from "./paths.js";
import { timestampForFilename } from "../utils/time.js";
import { execa } from "execa";

export async function captureScreenshot(projectRoot: string, device: AndroidDevice, variant?: AndroidVariant): Promise<string> {
  const dir = screenshotsDir(projectRoot);
  await fs.ensureDir(dir);
  const safeDeviceId = device.id.replace(/[^A-Za-z0-9._-]/g, "_");
  const safeVariant = (variant?.name ?? "device").replace(/[^A-Za-z0-9._-]/g, "_");
  const filePath = path.join(dir, `screenshot-${safeVariant}-${safeDeviceId}-${timestampForFilename()}.png`);
  const result = await execa("adb", ["-s", device.id, "exec-out", "screencap", "-p"], {
    encoding: "buffer",
    reject: false
  });
  if (result.exitCode !== 0) {
    throw new Error(`Screenshot failed for device "${device.id}".`);
  }
  await fs.writeFile(filePath, result.stdout);
  return filePath;
}
