import { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import { clearAppData, killApp, launchApp, uninstallApp } from "../core/appActions.js";
import { getAppStatus, type AppStatus } from "../core/appStatus.js";
import { selectVariantBuildTask } from "../core/buildWorkflow.js";
import { listDevices } from "../core/devices.js";
import { runDoctor } from "../core/doctor.js";
import { runGradle } from "../core/gradle.js";
import { updateProjectPreferences } from "../core/preferences.js";
import { stopTrackedProcesses } from "../core/processRunner.js";
import {
  loadProjectSession,
  resolveSessionApplicationId,
  resolveSessionVariant,
  type ProjectSession
} from "../core/session.js";
import { captureScreenshot } from "../core/screenshots.js";
import { openTestReportIfExists, runUnitTests, testReportPath, testStatusMessage } from "../core/testRunner.js";
import type { AndroidDevice } from "../types/device.js";
import type { DoctorCheck } from "../types/doctor.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";
import { ActionsPanel } from "./components/ActionsPanel.js";
import { BuildPanel } from "./components/BuildPanel.js";
import { DevicePanel } from "./components/DevicePanel.js";
import { DoctorPanel } from "./components/DoctorPanel.js";
import { Header } from "./components/Header.js";
import { HelpPanel } from "./components/HelpPanel.js";
import { LogPanel } from "./components/LogPanel.js";
import { Picker } from "./components/Picker.js";
import { VariantPanel } from "./components/VariantPanel.js";
import { useKeyboardActions } from "./hooks/useKeyboardActions.js";
import { useLogcat } from "./hooks/useLogcat.js";
import { appendOutputLine, idleCommandState, type DashboardView, type TuiCommandState } from "./state.js";

type LoadState =
  | { status: "loading" }
  | { status: "failed"; message: string; suggestion?: string }
  | { status: "loaded"; data: DashboardData };

type DashboardData = {
  session: ProjectSession;
  selectedVariant: AndroidVariant;
  devices: AndroidDevice[];
  selectedDevice?: AndroidDevice;
  deviceError?: string;
  doctorChecks: DoctorCheck[];
  appStatus: AppStatus;
};

export function App(): JSX.Element {
  const { exit } = useApp();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [view, setView] = useState<DashboardView>("dashboard");
  const [command, setCommand] = useState<TuiCommandState>(idleCommandState());
  const [logsEnabled, setLogsEnabled] = useState(false);
  const [logApplicationId, setLogApplicationId] = useState<string | undefined>();
  const [latestReportPath, setLatestReportPath] = useState<string | undefined>();

  const data = loadState.status === "loaded" ? loadState.data : undefined;
  const logs = useLogcat({
    enabled: logsEnabled,
    deviceId: data?.selectedDevice?.id,
    applicationId: logApplicationId,
    mode: data?.session.config.logcat.defaultMode ?? "warnings",
    tags: data?.session.config.logcat.tags ?? []
  });

  useEffect(() => {
    let active = true;
    loadDashboardData()
      .then((loaded) => {
        if (active) {
          setLoadState({ status: "loaded", data: loaded });
        }
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message = error instanceof DroidDeckError ? error.message.split("\n\n")[0] ?? error.message : error instanceof Error ? error.message : String(error);
        const suggestion = error instanceof DroidDeckError ? error.suggestion : undefined;
        setLoadState({ status: "failed", message, suggestion });
      });

    return () => {
      active = false;
    };
  }, []);

  useInput((input, key) => {
    if (loadState.status === "failed" && input === "q") {
      exit();
    }

    if (view !== "confirm-uninstall") {
      return;
    }

    if (input === "y") {
      void confirmUninstall();
    } else if (input === "n" || key.escape) {
      setView("dashboard");
      setCommand({
        title: "Uninstall",
        status: "idle",
        outputLines: ["Uninstall cancelled."]
      });
    }
  });

  useKeyboardActions(
    {
      onRun: () => void runSelected(false),
      onCleanRun: () => void runSelected(true),
      onSelectVariant: () => setView("variants"),
      onSelectDevice: () => setView("devices"),
      onClear: () => void runAppAction("Clear app data", clearAppData, (applicationId, deviceId) => `Cleared ${applicationId} on ${deviceId}.`),
      onLaunch: () => void runAppAction("Launch app", (deviceId, applicationId) => launchApp(requireData().session.config, deviceId, applicationId), (applicationId, deviceId) => `Launched ${applicationId} on ${deviceId}.`),
      onKill: () => void runAppAction("Kill app", killApp, (applicationId, deviceId) => `Stopped ${applicationId} on ${deviceId}.`),
      onUninstall: () => setView("confirm-uninstall"),
      onTest: () => void runTests(),
      onScreenshot: () => void captureSelectedScreenshot(),
      onLogs: () => void startLogs(),
      onDoctor: () => void showDoctor(),
      onHelp: () => setView("help"),
      onOpenReport: () => void openLatestReport(),
      onClearVisibleLogs: () => logs.clear(),
      onQuit: () => {
        setLogsEnabled(false);
        stopTrackedProcesses();
        exit();
      }
    },
    Boolean(data) && command.status !== "running" && view !== "variants" && view !== "devices" && view !== "confirm-uninstall"
  );

  const variantItems = useMemo(
    () => data?.session.variants.map((variant) => ({ label: variant.name, value: variant.name })) ?? [],
    [data?.session.variants]
  );
  const deviceItems = useMemo(
    () =>
      data?.devices
        .filter((device) => device.state === "device")
        .map((device) => ({ label: `${device.model ?? device.id} (${device.id})`, value: device.id })) ?? [],
    [data?.devices]
  );

  if (loadState.status === "loading") {
    return (
      <Box>
        <Text color="green">
          <Spinner type="dots" /> Loading DroidDeck...
        </Text>
      </Box>
    );
  }

  if (loadState.status === "failed") {
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Text color="red" bold>DroidDeck cannot start</Text>
        <Text>{loadState.message}</Text>
        {loadState.suggestion ? <Text color="yellow">{loadState.suggestion}</Text> : null}
        <Text dimColor>Press q to quit.</Text>
      </Box>
    );
  }

  if (view === "variants") {
    return (
      <Picker
        title="Select Variant"
        items={variantItems}
        emptyMessage="No variants discovered."
        onSelect={(variantName) => void selectVariant(variantName)}
      />
    );
  }

  if (view === "devices") {
    return (
      <Picker
        title="Select Device"
        items={deviceItems}
        emptyMessage="No online devices available."
        onSelect={(deviceId) => void selectDevice(deviceId)}
      />
    );
  }

  const loaded = loadState.data;

  return (
    <Box flexDirection="column">
      <Header
        project={loaded.session.project}
        doctorChecks={loaded.doctorChecks}
        selectedVariant={loaded.selectedVariant}
        selectedDevice={loaded.selectedDevice}
        appStatus={loaded.appStatus}
      />
      {view === "doctor" ? <DoctorPanel checks={loaded.doctorChecks} /> : null}
      {view === "help" ? <HelpPanel /> : null}
      {view === "confirm-uninstall" ? (
        <Box flexDirection="column" borderStyle="round" paddingX={1}>
          <Text color="yellow" bold>Confirm uninstall</Text>
          <Text>
            Uninstall {loaded.selectedVariant.name} from {loaded.selectedDevice?.id ?? "no selected device"}?
          </Text>
          <Text>Press y to uninstall or n to cancel.</Text>
        </Box>
      ) : null}
      <Box>
        <VariantPanel variants={loaded.session.variants} selectedVariant={loaded.selectedVariant} />
        <DevicePanel devices={loaded.devices} selectedDevice={loaded.selectedDevice} deviceError={loaded.deviceError} />
      </Box>
      <BuildPanel command={command} />
      <LogPanel lines={logs.lines} status={logs.status} warning={logs.warning} error={logs.error} />
      {latestReportPath ? <Text dimColor>Latest test report: {latestReportPath}</Text> : null}
      <ActionsPanel />
    </Box>
  );

  function requireData(): DashboardData {
    if (!data) {
      throw new DroidDeckError("DroidDeck is not ready yet.");
    }
    return data;
  }

  async function executeCommand(title: string, action: (onLine: (line: string) => void) => Promise<void>): Promise<void> {
    if (command.status === "running") {
      return;
    }

    const startedAt = Date.now();
    setCommand({ title, status: "running", outputLines: [], startedAt });
    try {
      await action((line) => setCommand((current) => appendOutputLine(current, line)));
      setCommand((current) => ({
        ...current,
        status: "success",
        endedAt: Date.now()
      }));
    } catch (error) {
      const message = error instanceof DroidDeckError ? error.message.split("\n\n")[0] ?? error.message : error instanceof Error ? error.message : String(error);
      const suggestion = error instanceof DroidDeckError ? error.suggestion : undefined;
      setCommand((current) => ({
        ...current,
        status: "failed",
        error: suggestion ? `${message}\n${suggestion}` : message,
        endedAt: Date.now()
      }));
    }
  }

  async function runSelected(clean: boolean): Promise<void> {
    await executeCommand(clean ? "Clean run" : "Run", async (onLine) => {
      const current = requireReadySelection(requireData());

      if (clean) {
        onLine("Running Gradle clean...");
        const cleanResult = await runGradle(current.session.projectRoot, ["clean"], onLine);
        if (cleanResult.exitCode !== 0) {
          throw new DroidDeckError("Gradle clean failed.", cleanResult.outputLines.slice(-20).join("\n"));
        }
      }

      const buildTask = selectVariantBuildTask(current.selectedVariant);
      onLine(`Running ${buildTask.task}...`);
      const buildResult = await runGradle(current.session.projectRoot, [buildTask.task], onLine);
      if (buildResult.exitCode !== 0) {
        throw new DroidDeckError(`Gradle task failed: ${buildTask.task}`, buildResult.outputLines.slice(-20).join("\n"));
      }

      if (!buildTask.installs) {
        onLine("Variant assembled, but no install task was found.");
        return;
      }

      const applicationId = await resolveSessionApplicationId(current.session, current.selectedVariant);
      await launchApp(current.session.config, current.selectedDevice.id, applicationId);
      setLogApplicationId(applicationId);
      setLoadState((currentState) =>
        currentState.status === "loaded"
          ? {
              status: "loaded",
              data: {
                ...currentState.data,
                appStatus: "running"
              }
            }
          : currentState
      );
      onLine(`Launched ${applicationId} on ${current.selectedDevice.id}.`);
    });
  }

  async function runAppAction(
    title: string,
    action: (deviceId: string, applicationId: string) => Promise<void>,
    successMessage: (applicationId: string, deviceId: string) => string
  ): Promise<void> {
    await executeCommand(title, async (onLine) => {
      const current = requireReadySelection(requireData());
      const applicationId = await resolveSessionApplicationId(current.session, current.selectedVariant);
      await action(current.selectedDevice.id, applicationId);
      onLine(successMessage(applicationId, current.selectedDevice.id));
    });
  }

  async function confirmUninstall(): Promise<void> {
    setView("dashboard");
    await runAppAction("Uninstall", uninstallApp, (applicationId, deviceId) => `Uninstalled ${applicationId} from ${deviceId}.`);
  }

  async function runTests(): Promise<void> {
    await executeCommand("Run tests", async (onLine) => {
      const current = requireData();
      const result = await runUnitTests(current.session.projectRoot, current.selectedVariant, onLine);
      const reportPath = testReportPath(current.session.projectRoot, current.session.config.appModule, current.selectedVariant);
      setLatestReportPath(reportPath);
      onLine(testStatusMessage(result));
      onLine(`Report: ${reportPath}`);
      if (result.exitCode !== 0) {
        throw new DroidDeckError("Unit tests failed.", result.outputLines.slice(-20).join("\n"));
      }
    });
  }

  async function captureSelectedScreenshot(): Promise<void> {
    await executeCommand("Screenshot", async (onLine) => {
      const current = requireReadySelection(requireData());
      const filePath = await captureScreenshot(current.session.projectRoot, current.selectedDevice, current.selectedVariant);
      onLine(filePath);
    });
  }

  async function startLogs(): Promise<void> {
    const current = requireData();
    if (!current.selectedDevice) {
      setCommand({
        title: "Logs",
        status: "failed",
        outputLines: [],
        error: "No selected online Android device. Press d to select a device."
      });
      return;
    }

    setView("logs");
    setLogsEnabled(true);
    try {
      setLogApplicationId(await resolveSessionApplicationId(current.session, current.selectedVariant));
    } catch {
      setLogApplicationId(undefined);
    }
  }

  async function showDoctor(): Promise<void> {
    setView("doctor");
    const checks = await runDoctor();
    setLoadState((current) =>
      current.status === "loaded"
        ? {
            status: "loaded",
            data: {
              ...current.data,
              doctorChecks: checks
            }
          }
        : current
    );
  }

  async function openLatestReport(): Promise<void> {
    await executeCommand("Open test report", async (onLine) => {
      const current = requireData();
      const openedReport = await openTestReportIfExists(current.session.projectRoot, current.session.config.appModule, current.selectedVariant);
      if (!openedReport) {
        throw new DroidDeckError("Test report was not found.", latestReportPath ? `Expected ${latestReportPath}` : "Run tests first.");
      }
      onLine(`Opened ${openedReport}`);
    });
  }

  async function selectVariant(variantName: string): Promise<void> {
    const current = requireData();
    const selectedVariant = resolveSessionVariant(current.session, variantName);
    await updateProjectPreferences(current.session.projectRoot, { lastVariant: selectedVariant.name });
    const appStatus = await getDashboardAppStatus(current.session, current.selectedDevice, selectedVariant);
    setLoadState({
      status: "loaded",
      data: {
        ...current,
        selectedVariant,
        appStatus,
        session: {
          ...current.session,
          preferences: {
            ...current.session.preferences,
            lastVariant: selectedVariant.name
          }
        }
      }
    });
    setView("dashboard");
  }

  async function selectDevice(deviceId: string): Promise<void> {
    const current = requireData();
    const selectedDevice = current.devices.find((device) => device.id === deviceId && device.state === "device");
    if (!selectedDevice) {
      return;
    }

    await updateProjectPreferences(current.session.projectRoot, { lastDeviceId: selectedDevice.id });
    const appStatus = await getDashboardAppStatus(current.session, selectedDevice, current.selectedVariant);
    setLoadState({
      status: "loaded",
      data: {
        ...current,
        selectedDevice,
        appStatus,
        deviceError: undefined,
        session: {
          ...current.session,
          preferences: {
            ...current.session.preferences,
            lastDeviceId: selectedDevice.id
          }
        }
      }
    });
    setView("dashboard");
  }
}

async function loadDashboardData(): Promise<DashboardData> {
  const session = await loadProjectSession();
  const [devicesResult, doctorChecks] = await Promise.allSettled([listDevices(), runDoctor()]);
  const devices = devicesResult.status === "fulfilled" ? devicesResult.value : [];
  const deviceError = devicesResult.status === "rejected" ? toErrorMessage(devicesResult.reason) : undefined;
  const selectedDevice = selectInitialDevice(devices, session.preferences.lastDeviceId);
  const selectedVariant = resolveSessionVariant(session);
  const appStatus = await getDashboardAppStatus(session, selectedDevice, selectedVariant);

  return {
    session,
    selectedVariant,
    devices,
    selectedDevice,
    deviceError,
    doctorChecks: doctorChecks.status === "fulfilled" ? doctorChecks.value : [],
    appStatus
  };
}

function selectInitialDevice(devices: readonly AndroidDevice[], persistedDeviceId?: string): AndroidDevice | undefined {
  const onlineDevices = devices.filter((device) => device.state === "device");
  if (persistedDeviceId) {
    const persisted = onlineDevices.find((device) => device.id === persistedDeviceId);
    if (persisted) {
      return persisted;
    }
  }

  return onlineDevices.length === 1 ? onlineDevices[0] : undefined;
}

async function getDashboardAppStatus(session: ProjectSession, selectedDevice: AndroidDevice | undefined, selectedVariant: AndroidVariant): Promise<AppStatus> {
  if (!selectedDevice) {
    return "unknown";
  }

  try {
    const applicationId = await resolveSessionApplicationId(session, selectedVariant);
    return await getAppStatus(selectedDevice.id, applicationId);
  } catch {
    return "unknown";
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requireReadySelection(data: DashboardData): DashboardData & { selectedDevice: AndroidDevice } {
  if (!data.selectedDevice) {
    throw new DroidDeckError("No selected online Android device.", "Press d to select a device.");
  }

  return data as DashboardData & { selectedDevice: AndroidDevice };
}
