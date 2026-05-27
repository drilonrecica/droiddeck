import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { AndroidDevice } from "../types/device.js";
import type { AndroidVariant } from "../types/variant.js";
import type { DoctorCheck } from "../types/doctor.js";
import type { CommandState } from "../types/command.js";
import type { LogLine } from "../types/log.js";
import { loadCommandContext, type CommandContext } from "../cli/context.js";
import { listDevices, resolveDevice } from "../core/devices.js";
import { runDoctor } from "../core/doctor.js";
import { resolveVariant } from "../core/variantResolver.js";
import { updateProjectPreferences } from "../core/preferences.js";
import { resolveApplicationId } from "../core/appIdResolver.js";
import { runGradleTask } from "../core/gradle.js";
import { adbDeviceArgs, runAdb } from "../core/adb.js";
import { runUnitTests, testReportPath, openTestReportIfExists } from "../core/testRunner.js";
import { captureScreenshot } from "../core/screenshots.js";
import { Header } from "./components/Header.js";
import { VariantPanel } from "./components/VariantPanel.js";
import { DevicePanel } from "./components/DevicePanel.js";
import { BuildPanel } from "./components/BuildPanel.js";
import { LogPanel } from "./components/LogPanel.js";
import { ActionsPanel } from "./components/ActionsPanel.js";
import { DoctorPanel } from "./components/DoctorPanel.js";
import { HelpPanel } from "./components/HelpPanel.js";
import { Picker } from "./components/Picker.js";

type ActivePanel = "main" | "variant-picker" | "device-picker" | "doctor" | "help" | "logs";

export function App(): React.ReactElement {
  const { exit } = useApp();
  const [context, setContext] = useState<CommandContext>();
  const [devices, setDevices] = useState<AndroidDevice[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<AndroidVariant>();
  const [selectedDevice, setSelectedDevice] = useState<AndroidDevice>();
  const [doctorChecks, setDoctorChecks] = useState<DoctorCheck[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>("main");
  const [commandState, setCommandState] = useState<CommandState>({ status: "idle", outputLines: [] });
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [error, setError] = useState<string>();
  const [latestReport, setLatestReport] = useState<string>();
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const appendOutput = useCallback((line: string) => {
    setCommandState((state) => ({ ...state, outputLines: [...state.outputLines, line].slice(-20) }));
  }, []);

  const load = useCallback(async () => {
    try {
      const loadedContext = await loadCommandContext();
      const loadedDevices = await listDevices().catch(() => []);
      const selected = resolveVariant(
        loadedContext.variants,
        loadedContext.config.variantAliases,
        undefined,
        loadedContext.preferences.lastVariant
      );
      const selectedAndroidDevice =
        loadedDevices.length > 0 ? resolveDevice(loadedDevices, undefined, loadedContext.preferences.lastDeviceId) : undefined;
      setContext(loadedContext);
      setDevices(loadedDevices);
      setSelectedVariant(selected);
      setSelectedDevice(selectedAndroidDevice);
      setDoctorChecks(await runDoctor());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setDoctorChecks(await runDoctor().catch(() => []));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (label: string, action: () => Promise<void>) => {
      setCommandState({ status: "running", command: label, startedAt: Date.now(), outputLines: [] });
      try {
        await action();
        setCommandState((state) => ({ ...state, status: "success", endedAt: Date.now() }));
      } catch (actionError) {
        setCommandState((state) => ({
          ...state,
          status: "failed",
          endedAt: Date.now(),
          error: actionError instanceof Error ? actionError.message : String(actionError)
        }));
      }
    },
    []
  );

  const requireSelection = useCallback(() => {
    if (!context || !selectedVariant || !selectedDevice) {
      throw new Error("Select a variant and online device first.");
    }
    return { context, selectedVariant, selectedDevice };
  }, [context, selectedVariant, selectedDevice]);

  useInput((input) => {
    if (input === "q") {
      exit();
      return;
    }
    if (input === "?") {
      setActivePanel((panel) => (panel === "help" ? "main" : "help"));
      return;
    }
    if (input === "D") {
      setActivePanel((panel) => (panel === "doctor" ? "main" : "doctor"));
      return;
    }
    if (input === "v") {
      setActivePanel("variant-picker");
      return;
    }
    if (input === "d") {
      setActivePanel("device-picker");
      return;
    }
    if (input === "g") {
      setActivePanel((panel) => (panel === "logs" ? "main" : "logs"));
      return;
    }
    if (input === "C") {
      setLogLines([]);
      return;
    }
    if (input === "r" || input === "R") {
      void runAction(input === "R" ? "clean run" : "run", async () => {
        const selection = requireSelection();
        if (input === "R") {
          const clean = await runGradleTask(selection.context.projectRoot, ["clean"], appendOutput);
          if (clean.exitCode !== 0) throw new Error("Gradle clean failed.");
        }
        const task = selection.selectedVariant.installTask ?? selection.selectedVariant.assembleTask;
        if (!task) throw new Error(`No install or assemble task found for ${selection.selectedVariant.name}.`);
        const build = await runGradleTask(selection.context.projectRoot, [task], appendOutput);
        if (build.exitCode !== 0) throw new Error(`Gradle task failed: ${task}`);
        if (!selection.selectedVariant.installTask) {
          appendOutput("Variant assembled, but no install task was found.");
          return;
        }
        const appId = resolveApplicationId(selection.context.config, selection.selectedVariant);
        const launch = await runAdb([...adbDeviceArgs(selection.selectedDevice.id), "shell", "monkey", "-p", appId, "1"]);
        if (launch.exitCode !== 0) throw new Error("Launch failed.");
        setLogLines((lines) => [...lines, { raw: `DroidDeck session started: ${selection.selectedVariant.name}`, message: "" }]);
      });
      return;
    }
    if (input === "u" && !confirmUninstall) {
      setConfirmUninstall(true);
      setCommandState({
        status: "idle",
        command: "uninstall",
        outputLines: ["Press u again to confirm uninstall, or press any other action to cancel."]
      });
      return;
    }
    if (input !== "u") {
      setConfirmUninstall(false);
    }
    if (input === "c" || input === "l" || input === "k" || input === "u" || input === "t" || input === "s" || input === "o") {
      void runAction(input, async () => {
        const selection = requireSelection();
        const appId = input === "s" || input === "t" || input === "o" ? undefined : resolveApplicationId(selection.context.config, selection.selectedVariant);
        if (input === "c") await assertAdb(runAdb([...adbDeviceArgs(selection.selectedDevice.id), "shell", "pm", "clear", appId!]));
        if (input === "l") await assertAdb(runAdb([...adbDeviceArgs(selection.selectedDevice.id), "shell", "monkey", "-p", appId!, "1"]));
        if (input === "k") await assertAdb(runAdb([...adbDeviceArgs(selection.selectedDevice.id), "shell", "am", "force-stop", appId!]));
        if (input === "u") {
          await assertAdb(runAdb([...adbDeviceArgs(selection.selectedDevice.id), "uninstall", appId!]));
          setConfirmUninstall(false);
        }
        if (input === "t") {
          const result = await runUnitTests(selection.context.projectRoot, selection.selectedVariant, appendOutput);
          setLatestReport(testReportPath(selection.context.projectRoot, selection.context.config.appModule, selection.selectedVariant));
          if (result.exitCode !== 0) throw new Error("Tests failed.");
        }
        if (input === "s") {
          const file = await captureScreenshot(selection.context.projectRoot, selection.selectedDevice, selection.selectedVariant);
          appendOutput(`Screenshot: ${file}`);
        }
        if (input === "o") {
          const opened = await openTestReportIfExists(selection.context.projectRoot, selection.context.config.appModule, selection.selectedVariant);
          if (!opened) throw new Error(latestReport ? `Report not found: ${latestReport}` : "No test report available.");
        }
      });
    }
  });

  const doctorSummary = useMemo(() => {
    const passed = doctorChecks.filter((check) => check.status === "pass").length;
    return `${passed}/${doctorChecks.length}`;
  }, [doctorChecks]);

  if (error && !context) {
    return (
      <Box flexDirection="column">
        <Text color="red">DroidDeck could not start.</Text>
        <Text>{error}</Text>
        <Text dimColor>Press q to quit.</Text>
      </Box>
    );
  }

  if (!context) {
    return <Text>Loading DroidDeck...</Text>;
  }

  if (activePanel === "variant-picker") {
    return (
      <Picker
        title="Select variant"
        items={context.variants.map((variant) => ({ label: variant.name, value: variant.name }))}
        onSelect={(value) => {
          const variant = context.variants.find((candidate) => candidate.name === value);
          setSelectedVariant(variant);
          if (variant) void updateProjectPreferences(context.projectRoot, { lastVariant: variant.name });
          setActivePanel("main");
        }}
      />
    );
  }

  if (activePanel === "device-picker") {
    return (
      <Picker
        title="Select device"
        items={devices.map((device) => ({ label: `${device.id} (${device.state})`, value: device.id }))}
        onSelect={(value) => {
          const device = devices.find((candidate) => candidate.id === value);
          setSelectedDevice(device);
          if (device) void updateProjectPreferences(context.projectRoot, { lastDeviceId: device.id });
          setActivePanel("main");
        }}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Header project={context.project} selectedVariant={selectedVariant} selectedDevice={selectedDevice} doctorSummary={doctorSummary} />
      <Box gap={2}>
        <VariantPanel variants={context.variants} selectedVariant={selectedVariant} />
        <DevicePanel devices={devices} selectedDevice={selectedDevice} />
      </Box>
      <BuildPanel state={commandState} />
      {activePanel === "doctor" ? <DoctorPanel checks={doctorChecks} /> : activePanel === "help" ? <HelpPanel /> : <LogPanel lines={logLines} />}
      <ActionsPanel />
    </Box>
  );
}

async function assertAdb(resultPromise: ReturnType<typeof runAdb>): Promise<void> {
  const result = await resultPromise;
  if (result.exitCode !== 0) {
    throw new Error(result.outputLines.slice(-10).join("\n") || "ADB command failed.");
  }
}
