import { describe, expect, it } from "vitest";
import {
  clearAppDataArgs,
  killAppArgs,
  launchAppArgs,
  uninstallAppArgs
} from "../../src/core/appActions.js";
import { defaultConfig } from "../../src/core/config.js";

describe("app action args", () => {
  it("builds clear app data args", () => {
    expect(clearAppDataArgs("emulator-5554", "com.example.app")).toEqual([
      "-s",
      "emulator-5554",
      "shell",
      "pm",
      "clear",
      "com.example.app"
    ]);
  });

  it("builds monkey launch args by default", () => {
    expect(launchAppArgs(defaultConfig(), "emulator-5554", "com.example.app")).toEqual([
      "-s",
      "emulator-5554",
      "shell",
      "monkey",
      "-p",
      "com.example.app",
      "1"
    ]);
  });

  it("builds activity launch args when configured", () => {
    expect(
      launchAppArgs(
        {
          ...defaultConfig(),
          mainActivity: ".MainActivity",
          actions: { launchMode: "activity" }
        },
        "emulator-5554",
        "com.example.app"
      )
    ).toEqual(["-s", "emulator-5554", "shell", "am", "start", "-n", "com.example.app/.MainActivity"]);
  });

  it("builds kill and uninstall args", () => {
    expect(killAppArgs("device-1", "com.example.app")).toEqual(["-s", "device-1", "shell", "am", "force-stop", "com.example.app"]);
    expect(uninstallAppArgs("device-1", "com.example.app")).toEqual(["-s", "device-1", "uninstall", "com.example.app"]);
  });
});

