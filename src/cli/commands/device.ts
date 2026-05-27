import { listDevices, resolveDevice } from "../../core/devices.js";
import { updateProjectPreferences } from "../../core/preferences.js";
import { findProjectRoot } from "../../core/projectDetector.js";
import { DroidDeckError } from "../../utils/errors.js";

export async function deviceCommand(deviceId: string): Promise<void> {
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    throw new DroidDeckError("Android project root not found.", "Run DroidDeck from an Android project directory before selecting a device.");
  }

  const devices = await listDevices(false);
  const selectedDevice = resolveDevice(devices, deviceId);
  await updateProjectPreferences(projectRoot, { lastDeviceId: selectedDevice.id });

  console.log(`Selected device: ${selectedDevice.id}`);
}

