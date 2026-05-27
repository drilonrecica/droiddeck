import { listDevices } from "../../core/devices.js";

export async function runDevicesCommand(): Promise<void> {
  const devices = await listDevices();
  if (devices.length === 0) {
    console.log("No devices found.");
    return;
  }

  for (const device of devices) {
    console.log(
      [
        device.id,
        device.state,
        device.model,
        device.androidVersion ? `Android ${device.androidVersion}` : undefined,
        device.apiLevel ? `API ${device.apiLevel}` : undefined,
        device.isEmulator ? "emulator" : "physical"
      ]
        .filter(Boolean)
        .join("  ")
    );
  }
}
