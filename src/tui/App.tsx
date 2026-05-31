import type { KeyEvent } from "@opentui/core";
import { useKeyboard, useRenderer } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import { clearAppData, killApp, launchApp, uninstallApp } from "../core/appActions.js";
import { getAppStatus, type AppStatus } from "../core/appStatus.js";
import { selectVariantBuildTask } from "../core/buildWorkflow.js";
import { listDevices } from "../core/devices.js";
import { runDoctor } from "../core/doctor.js";
import { runGradle } from "../core/gradle.js";
import { updateProjectPreferences } from "../core/preferences.js";
import { stopTrackedProcesses } from "../core/processRunner.js";
import { loadProjectSession, resolveSessionApplicationId, type ProjectSession } from "../core/session.js";
import { captureScreenshot } from "../core/screenshots.js";
import { openTestReportIfExists, runUnitTests, testReportPath, testStatusMessage } from "../core/testRunner.js";
import type { AndroidDevice } from "../types/device.js";
import type { DoctorCheck } from "../types/doctor.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";
import { createDashboardActions, type DashboardActionId } from "./actions.js";
import { ActionsPanel } from "./components/ActionsPanel.js";
import { BuildPanel } from "./components/BuildPanel.js";
import { DevicePanel } from "./components/DevicePanel.js";
import { DoctorPanel } from "./components/DoctorPanel.js";
import { Header } from "./components/Header.js";
import { HelpPanel } from "./components/HelpPanel.js";
import { Line } from "./components/Line.js";
import { LogPanel } from "./components/LogPanel.js";
import { Picker } from "./components/Picker.js";
import { StatusBar } from "./components/StatusBar.js";
import { VariantPanel } from "./components/VariantPanel.js";
import { useKeyboardActions } from "./hooks/useKeyboardActions.js";
import { useLogcat } from "./hooks/useLogcat.js";
import {
  activateFocusedDashboardItem,
  createDashboardNavigationState,
  cycleDashboardFocus,
  moveFocusedDashboardItem,
  normalizeDashboardNavigationState,
  setDashboardFocus,
  type DashboardNavigationCounts,
  type DashboardNavigationIntent
} from "./navigation.js";
import { resolveInitialVariantSelection } from "./selection.js";
import { appendOutputLine, idleCommandState, type DashboardView, type TuiCommandState } from "./state.js";

const visibleLogLineLimit = 1;

type LoadState =
  | { status: "loading" }
  | { status: "failed"; message: string; suggestion?: string }
  | { status: "loaded"; data: DashboardData };

type DashboardData = {
  session: ProjectSession;
  selectableVariants: AndroidVariant[];
  selectedVariant?: AndroidVariant;
  devices: AndroidDevice[];
  selectedDevice?: AndroidDevice;
  deviceError?: string;
  doctorChecks: DoctorCheck[];
  appStatus: AppStatus;
  selectionMessage?: string;
};

export function App() {
  const renderer = useRenderer();
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [view, setView] = useState<DashboardView>("dashboard");
  const [command, setCommand] = useState<TuiCommandState>(idleCommandState());
  const [logsEnabled, setLogsEnabled] = useState(false);
  const [logApplicationId, setLogApplicationId] = useState<string | undefined>();
  const [latestReportPath, setLatestReportPath] = useState<string | undefined>();
  const [navigation, setNavigation] = useState(() => createDashboardNavigationState());
  const [statusMessage, setStatusMessage] = useState<string | undefined>();

  const data = loadState.status === "loaded" ? loadState.data : undefined;
  const logs = useLogcat({
    enabled: logsEnabled,
    deviceId: data?.selectedDevice?.id,
    applicationId: logApplicationId,
    mode: data?.session.config.logcat.defaultMode ?? "warnings",
    tags: data?.session.config.logcat.tags ?? []
  });

  const onlineDevices = useMemo(() => data?.devices.filter((device) => device.state === "device") ?? [], [data?.devices]);
  const dashboardActions = useMemo(
    () =>
      createDashboardActions({
        hasVariant: Boolean(data?.selectedVariant),
        hasDevice: Boolean(data?.selectedDevice),
        logsRunning: logs.status === "starting" || logs.status === "streaming"
      }),
    [data?.selectedVariant, data?.selectedDevice, logs.status]
  );
  const navigationCounts = useMemo<DashboardNavigationCounts>(
    () => ({
      variants: data?.selectableVariants.length ?? 0,
      devices: onlineDevices.length,
      actions: dashboardActions.length,
      logLines: logs.lines.length,
      visibleLogLines: visibleLogLineLimit
    }),
    [dashboardActions.length, data?.selectableVariants.length, logs.lines.length, onlineDevices.length]
  );
  const highlightedDevice = onlineDevices[navigation.deviceIndex];
  const selectedAction = dashboardActions[navigation.actionIndex];
  const dashboardKeyboardEnabled =
    Boolean(data) && command.status !== "running" && view !== "variants" && view !== "devices" && view !== "confirm-uninstall";

  useEffect(() => {
    let active = true;
    loadDashboardData()
      .then((loaded) => {
        if (!active) {
          return;
        }

        const loadedOnlineDevices = loaded.devices.filter((device) => device.state === "device");
        const selectedVariantIndex = loaded.selectedVariant
          ? loaded.selectableVariants.findIndex((variant) => variant.name === loaded.selectedVariant?.name)
          : 0;
        const selectedDeviceIndex = loaded.selectedDevice ? loadedOnlineDevices.findIndex((device) => device.id === loaded.selectedDevice?.id) : 0;
        setNavigation((current) =>
          normalizeDashboardNavigationState(
            {
              ...current,
              variantIndex: Math.max(0, selectedVariantIndex),
              deviceIndex: Math.max(0, selectedDeviceIndex)
            },
            {
              variants: loaded.selectableVariants.length,
              devices: loadedOnlineDevices.length,
              actions: createDashboardActions({
                hasVariant: Boolean(loaded.selectedVariant),
                hasDevice: Boolean(loaded.selectedDevice),
                logsRunning: false
              }).length,
              logLines: 0,
              visibleLogLines: visibleLogLineLimit
            }
          )
        );
        setLoadState({ status: "loaded", data: loaded });
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

  useEffect(() => {
    if (!data) {
      return;
    }

    const selectedVariantIndex = data.selectedVariant
      ? data.selectableVariants.findIndex((variant) => variant.name === data.selectedVariant?.name)
      : -1;
    const selectedDeviceIndex = data.selectedDevice ? onlineDevices.findIndex((device) => device.id === data.selectedDevice?.id) : -1;

    setNavigation((current) =>
      normalizeDashboardNavigationState(
        {
          ...current,
          variantIndex: selectedVariantIndex >= 0 ? selectedVariantIndex : current.variantIndex,
          deviceIndex: selectedDeviceIndex >= 0 ? selectedDeviceIndex : current.deviceIndex
        },
        navigationCounts
      )
    );
  }, [data, navigationCounts, onlineDevices]);

  useKeyboard((key) => {
    if (key.eventType !== "press") {
      return;
    }

    if (loadState.status === "failed" && isKey(key, "q")) {
      key.preventDefault();
      quit();
      return;
    }

    if (view === "confirm-uninstall") {
      if (isKey(key, "y")) {
        consumeKey(key);
        void confirmUninstall();
      } else if (isKey(key, "n") || isEscape(key)) {
        consumeKey(key);
        setView("dashboard");
        setCommand({
          title: "Uninstall",
          status: "idle",
          outputLines: ["Uninstall cancelled."]
        });
      }
      return;
    }

    if (!dashboardKeyboardEnabled) {
      return;
    }

    if (isEscape(key)) {
      consumeKey(key);
      setView("dashboard");
      setStatusMessage(undefined);
      return;
    }

    if (isShiftTab(key)) {
      consumeKey(key);
      setNavigation((current) => cycleDashboardFocus(current, "previous"));
      setStatusMessage(undefined);
      return;
    }

    if (isTab(key)) {
      consumeKey(key);
      setNavigation((current) => cycleDashboardFocus(current, "next"));
      setStatusMessage(undefined);
      return;
    }

    if (isArrowLeft(key)) {
      consumeKey(key);
      setNavigation((current) => cycleDashboardFocus(current, "previous"));
      setStatusMessage(undefined);
      return;
    }

    if (isArrowRight(key)) {
      consumeKey(key);
      setNavigation((current) => cycleDashboardFocus(current, "next"));
      setStatusMessage(undefined);
      return;
    }

    if (isArrowUp(key) || (isKey(key, "k") && !key.shift)) {
      consumeKey(key);
      setNavigation((current) => moveFocusedDashboardItem(current, navigationCounts, "previous"));
      setStatusMessage(undefined);
      return;
    }

    if (isArrowDown(key) || isKey(key, "j")) {
      consumeKey(key);
      setNavigation((current) => moveFocusedDashboardItem(current, navigationCounts, "next"));
      setStatusMessage(undefined);
      return;
    }

    if (isEnter(key)) {
      consumeKey(key);
      void handleNavigationIntent(activateFocusedDashboardItem(navigation, navigationCounts, dashboardActions));
    }
  });

  useKeyboardActions(
    {
      onRun: () => void runSelected(false),
      onCleanRun: () => void runSelected(true),
      onSelectVariant: () => {
        setNavigation((current) => setDashboardFocus(current, "variants"));
        setView("variants");
      },
      onSelectDevice: () => {
        setNavigation((current) => setDashboardFocus(current, "devices"));
        setView("devices");
      },
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
      onQuit: quit
    },
    dashboardKeyboardEnabled
  );

  const variantItems = useMemo(
    () => data?.selectableVariants.map((variant) => ({ label: variant.name, value: variant.name })) ?? [],
    [data?.selectableVariants]
  );
  const deviceItems = useMemo(
    () => onlineDevices.map((device) => ({ label: `${device.model ?? device.id} (${device.id})`, value: device.id })),
    [onlineDevices]
  );

  if (loadState.status === "loading") {
    return (
      <box>
        <Line fg="#22C55E">Loading DroidDeck...</Line>
      </box>
    );
  }

  if (loadState.status === "failed") {
    return (
      <box title="DroidDeck cannot start" flexDirection="column" border borderStyle="rounded" paddingX={1} height={(loadState.suggestion ? 3 : 2) + 2}>
        <Line fg="#EF4444">{loadState.message}</Line>
        {loadState.suggestion ? <Line fg="#F59E0B">{loadState.suggestion}</Line> : null}
        <Line fg="#9CA3AF">Press q to quit.</Line>
      </box>
    );
  }

  if (view === "variants") {
    return (
      <Picker
        title="Select Variant"
        items={variantItems}
        emptyMessage="No selectable app variants discovered."
        onSelect={(variantName) => void selectVariant(variantName)}
        onCancel={() => setView("dashboard")}
        onQuit={quit}
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
        onCancel={() => setView("dashboard")}
        onQuit={quit}
      />
    );
  }

  const loaded = loadState.data;
  const variantRows =
    (loaded.selectionMessage ? 1 : 0) +
    (loaded.selectableVariants.length === 0 ? 1 : Math.min(loaded.selectableVariants.length, 8)) +
    (loaded.selectableVariants.length > 8 ? 1 : 0);
  const deviceRows = (loaded.deviceError ? 1 : 0) + (loaded.devices.length === 0 ? 1 : Math.min(loaded.devices.length, 8)) + (loaded.devices.length > 8 ? 1 : 0);
  const selectionPanelsHeight = Math.max(variantRows, deviceRows) + 2;
  const footerMessage = statusMessage ?? (navigation.focus === "actions" && selectedAction && !selectedAction.enabled ? selectedAction.disabledReason : undefined);

  return (
    <box flexDirection="column">
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
        <box title="Confirm uninstall" flexDirection="column" border borderStyle="rounded" paddingX={1} height={4}>
          <Line fg="#F59E0B">{`Uninstall ${loaded.selectedVariant?.name ?? "no selected variant"} from ${loaded.selectedDevice?.id ?? "no selected device"}?`}</Line>
          <Line>Press y to uninstall or n to cancel.</Line>
        </box>
      ) : null}
      <box flexDirection="row" height={selectionPanelsHeight}>
        <VariantPanel
          variants={loaded.selectableVariants}
          selectedVariant={loaded.selectedVariant}
          highlightedIndex={navigation.variantIndex}
          focused={navigation.focus === "variants"}
          message={loaded.selectionMessage}
        />
        <DevicePanel
          devices={loaded.devices}
          selectedDevice={loaded.selectedDevice}
          highlightedDevice={highlightedDevice}
          focused={navigation.focus === "devices"}
          deviceError={loaded.deviceError}
        />
      </box>
      <BuildPanel command={command} focused={navigation.focus === "build"} />
      <LogPanel
        lines={logs.lines}
        status={logs.status}
        focused={navigation.focus === "logs"}
        scrollOffset={navigation.logScrollOffset}
        visibleLineLimit={visibleLogLineLimit}
        warning={logs.warning}
        error={logs.error}
      />
      {latestReportPath ? <Line fg="#9CA3AF">{`Latest test report: ${latestReportPath}`}</Line> : null}
      <ActionsPanel actions={dashboardActions} highlightedIndex={navigation.actionIndex} focused={navigation.focus === "actions"} />
      <StatusBar focus={navigation.focus} message={footerMessage} />
    </box>
  );

  async function handleNavigationIntent(intent: DashboardNavigationIntent): Promise<void> {
    setStatusMessage(undefined);

    if (intent.type === "select-variant") {
      const variant = data?.selectableVariants[intent.index];
      if (!variant) {
        setStatusMessage("No variant at the highlighted row.");
        return;
      }

      await selectVariant(variant.name);
      return;
    }

    if (intent.type === "select-device") {
      const device = onlineDevices[intent.index];
      if (!device) {
        setStatusMessage("No online device at the highlighted row.");
        return;
      }

      await selectDevice(device.id);
      return;
    }

    if (intent.type === "run-action") {
      handleDashboardAction(intent.actionId);
      return;
    }

    if (intent.type === "disabled-action") {
      setStatusMessage(intent.message);
      return;
    }

    if (intent.type === "start-logs") {
      setNavigation((current) => setDashboardFocus(current, "logs"));
      await startLogs();
      return;
    }

    if (intent.message) {
      setStatusMessage(intent.message);
    }
  }

  function handleDashboardAction(actionId: DashboardActionId): void {
    if (actionId === "run") {
      void runSelected(false);
    } else if (actionId === "clean-run") {
      void runSelected(true);
    } else if (actionId === "select-variant") {
      setNavigation((current) => setDashboardFocus(current, "variants"));
      setView("variants");
    } else if (actionId === "select-device") {
      setNavigation((current) => setDashboardFocus(current, "devices"));
      setView("devices");
    } else if (actionId === "clear-data") {
      void runAppAction("Clear app data", clearAppData, (applicationId, deviceId) => `Cleared ${applicationId} on ${deviceId}.`);
    } else if (actionId === "launch") {
      void runAppAction("Launch app", (deviceId, applicationId) => launchApp(requireData().session.config, deviceId, applicationId), (applicationId, deviceId) => `Launched ${applicationId} on ${deviceId}.`);
    } else if (actionId === "kill") {
      void runAppAction("Kill app", killApp, (applicationId, deviceId) => `Stopped ${applicationId} on ${deviceId}.`);
    } else if (actionId === "uninstall") {
      setView("confirm-uninstall");
    } else if (actionId === "test") {
      void runTests();
    } else if (actionId === "screenshot") {
      void captureSelectedScreenshot();
    } else if (actionId === "logs") {
      void startLogs();
    } else if (actionId === "doctor") {
      void showDoctor();
    } else if (actionId === "help") {
      setView("help");
    } else if (actionId === "open-report") {
      void openLatestReport();
    } else if (actionId === "clear-logs") {
      logs.clear();
    } else if (actionId === "quit") {
      quit();
    }
  }

  function quit(): void {
    setLogsEnabled(false);
    stopTrackedProcesses();
    renderer.destroy();
  }

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
      const current = requireSelectedVariant(requireData());
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
    setNavigation((currentNavigation) => setDashboardFocus(currentNavigation, "logs"));
    if (!current.selectedVariant) {
      setCommand({
        title: "Logs",
        status: "failed",
        outputLines: [],
        error: "No selected variant. Press v to select a variant."
      });
      return;
    }

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
      const current = requireSelectedVariant(requireData());
      const openedReport = await openTestReportIfExists(current.session.projectRoot, current.session.config.appModule, current.selectedVariant);
      if (!openedReport) {
        throw new DroidDeckError("Test report was not found.", latestReportPath ? `Expected ${latestReportPath}` : "Run tests first.");
      }
      onLine(`Opened ${openedReport}`);
    });
  }

  async function selectVariant(variantName: string): Promise<void> {
    const current = requireData();
    const selectedVariant = current.selectableVariants.find((variant) => variant.name === variantName);
    if (!selectedVariant) {
      return;
    }

    await updateProjectPreferences(current.session.projectRoot, { lastVariant: selectedVariant.name });
    const appStatus = await getDashboardAppStatus(current.session, current.selectedDevice, selectedVariant);
    setLoadState({
      status: "loaded",
      data: {
        ...current,
        selectedVariant,
        appStatus,
        selectionMessage: undefined,
        session: {
          ...current.session,
          preferences: {
            ...current.session.preferences,
            lastVariant: selectedVariant.name
          }
        }
      }
    });
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      focus: "variants",
      variantIndex: Math.max(0, current.selectableVariants.findIndex((variant) => variant.name === selectedVariant.name))
    }));
    setStatusMessage(`Selected variant ${selectedVariant.name}.`);
    setView("dashboard");
  }

  async function selectDevice(deviceId: string): Promise<void> {
    const current = requireData();
    const selectedDevice = current.devices.find((device) => device.id === deviceId && device.state === "device");
    if (!selectedDevice) {
      return;
    }

    await updateProjectPreferences(current.session.projectRoot, { lastDeviceId: selectedDevice.id });
    const appStatus = current.selectedVariant ? await getDashboardAppStatus(current.session, selectedDevice, current.selectedVariant) : "unknown";
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
    setNavigation((currentNavigation) => ({
      ...currentNavigation,
      focus: "devices",
      deviceIndex: Math.max(0, onlineDevices.findIndex((device) => device.id === selectedDevice.id))
    }));
    setStatusMessage(`Selected device ${selectedDevice.model ?? selectedDevice.id}.`);
    setView("dashboard");
  }
}

async function loadDashboardData(): Promise<DashboardData> {
  const session = await loadProjectSession();
  const [devicesResult, doctorChecks] = await Promise.allSettled([listDevices(), runDoctor()]);
  const devices = devicesResult.status === "fulfilled" ? devicesResult.value : [];
  const deviceError = devicesResult.status === "rejected" ? toErrorMessage(devicesResult.reason) : undefined;
  const selectedDevice = selectInitialDevice(devices, session.preferences.lastDeviceId);
  const initialVariant = resolveInitialVariantSelection(session.variants, session.preferences.lastVariant);
  const selectedVariant = initialVariant.status === "selected" ? initialVariant.variant : undefined;
  const appStatus = selectedVariant ? await getDashboardAppStatus(session, selectedDevice, selectedVariant) : "unknown";

  return {
    session,
    selectableVariants: initialVariant.selectableVariants,
    selectedVariant,
    devices,
    selectedDevice,
    deviceError,
    doctorChecks: doctorChecks.status === "fulfilled" ? doctorChecks.value : [],
    appStatus,
    selectionMessage: initialVariant.status === "empty" ? initialVariant.message : undefined
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

function requireSelectedVariant(data: DashboardData): DashboardData & { selectedVariant: AndroidVariant } {
  if (!data.selectedVariant) {
    throw new DroidDeckError("No selected variant.", "Press v to select a variant.");
  }

  return data as DashboardData & { selectedVariant: AndroidVariant };
}

function requireReadySelection(data: DashboardData): DashboardData & { selectedVariant: AndroidVariant; selectedDevice: AndroidDevice } {
  const withVariant = requireSelectedVariant(data);
  if (!withVariant.selectedDevice) {
    throw new DroidDeckError("No selected online Android device.", "Press d to select a device.");
  }

  return withVariant as DashboardData & { selectedVariant: AndroidVariant; selectedDevice: AndroidDevice };
}

function isKey(key: KeyEvent, value: string): boolean {
  return key.name === value || key.raw === value || key.sequence === value;
}

function consumeKey(key: KeyEvent): void {
  key.preventDefault();
  key.stopPropagation();
}

function isEscape(key: KeyEvent): boolean {
  return key.name === "escape" || key.raw === "\u001b" || key.sequence === "\u001b";
}

function isTab(key: KeyEvent): boolean {
  return key.name === "tab" || key.raw === "\t" || key.sequence === "\t";
}

function isShiftTab(key: KeyEvent): boolean {
  return key.name === "shift-tab" || key.name === "stab" || key.raw === "\u001b[Z" || key.sequence === "\u001b[Z" || (isTab(key) && key.shift);
}

function isEnter(key: KeyEvent): boolean {
  return key.name === "enter" || key.name === "return" || key.name === "kpenter" || key.raw === "\r" || key.raw === "\n" || key.sequence === "\r" || key.sequence === "\n";
}

function isArrowUp(key: KeyEvent): boolean {
  return key.name === "up" || key.name === "arrowup";
}

function isArrowDown(key: KeyEvent): boolean {
  return key.name === "down" || key.name === "arrowdown";
}

function isArrowLeft(key: KeyEvent): boolean {
  return key.name === "left" || key.name === "arrowleft";
}

function isArrowRight(key: KeyEvent): boolean {
  return key.name === "right" || key.name === "arrowright";
}
