import { describe, expect, it } from "vitest";
import { parseAdbDevices, resolveDevice } from "../../src/core/devices.js";

const devicesOutput = `List of devices attached
emulator-5554 device product:sdk_gphone model:Pixel_8 device:emu transport_id:1
R5CW123456 device usb:1-1 product:example model:Galaxy_S23 device:phone transport_id:2
offline-1 offline transport_id:3
unauthorized-1 unauthorized transport_id:4
`;

describe("devices", () => {
  it("parses online emulator and physical devices", () => {
    const devices = parseAdbDevices(devicesOutput);

    expect(devices).toContainEqual(
      expect.objectContaining({
        id: "emulator-5554",
        state: "device",
        model: "Pixel 8",
        isEmulator: true
      })
    );
    expect(devices).toContainEqual(
      expect.objectContaining({
        id: "R5CW123456",
        state: "device",
        model: "Galaxy S23",
        isEmulator: false
      })
    );
  });

  it("parses offline and unauthorized devices", () => {
    const devices = parseAdbDevices(devicesOutput);

    expect(devices).toContainEqual(expect.objectContaining({ id: "offline-1", state: "offline" }));
    expect(devices).toContainEqual(expect.objectContaining({ id: "unauthorized-1", state: "unauthorized" }));
  });

  it("resolves exactly one online device", () => {
    const [device] = parseAdbDevices(`List of devices attached
emulator-5554 device model:Pixel_8
`);

    expect(resolveDevice([device!]).id).toBe("emulator-5554");
  });

  it("fails when multiple online devices exist without selection", () => {
    const devices = parseAdbDevices(devicesOutput);

    expect(() => resolveDevice(devices)).toThrow(/Multiple Android devices/);
  });

  it("fails when requested device is disconnected", () => {
    const devices = parseAdbDevices(devicesOutput);

    expect(() => resolveDevice(devices, "offline-1")).toThrow(/not connected and online/);
  });
});

