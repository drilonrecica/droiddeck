import { describe, expect, it } from "vitest";
import { parseAdbDevices } from "../../src/core/devices.js";

describe("devices", () => {
  it("parses adb devices output", () => {
    const devices = parseAdbDevices(`List of devices attached
emulator-5554 device product:sdk_gphone model:Pixel_8 device:emu
R5CW123 unauthorized usb:1-1
`);
    expect(devices).toEqual([
      expect.objectContaining({ id: "emulator-5554", state: "device", model: "Pixel 8", isEmulator: true }),
      expect.objectContaining({ id: "R5CW123", state: "unauthorized", isEmulator: false })
    ]);
  });
});
