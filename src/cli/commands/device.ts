import { listDevices, resolveDevice } from "../../core/devices.js";
import { updateProjectPreferences } from "../../core/preferences.js";
import { loadCommandContext } from "../context.js";

export async function runDeviceCommand(deviceId: string): Promise<void> {
  const context = await loadCommandContext();
  const devices = await listDevices();
  const device = resolveDevice(devices, deviceId);
  await updateProjectPreferences(context.projectRoot, { lastDeviceId: device.id });
  console.log(`Selected device: ${device.id}`);
}
