import process from "node:process";
import fs from "fs-extra";
import { execa } from "execa";
import type { DoctorCheck } from "../types/doctor.js";
import type { DroidDeckConfig } from "../types/config.js";
import { findProjectRoot, getProjectInfo } from "./projectDetector.js";
import { loadConfig } from "./config.js";
import { loadPreferences, savePreferences } from "./preferences.js";
import { loadGradleTasks } from "./gradle.js";
import { parseGradleTasks } from "./variantDiscovery.js";
import { isAdbAvailable } from "./adb.js";
import { listDevices } from "./devices.js";
import { preferencesFilePath } from "./paths.js";

export async function runDoctor(startDir = process.cwd()): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const projectRoot = await findProjectRoot(startDir);
  let config: DroidDeckConfig | undefined;
  let appModule = "app";
  let tasksOutput: string | undefined;

  checks.push({
    id: "macos",
    label: "macOS detected",
    status: process.platform === "darwin" ? "pass" : "fail",
    message: process.platform === "darwin" ? "Running on macOS." : `Running on ${process.platform}; MVP1 supports macOS only.`
  });

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    id: "node",
    label: "Node.js version supported",
    status: nodeMajor >= 20 ? "pass" : "fail",
    message: `Node.js ${process.versions.node}`
  });

  checks.push({
    id: "project-root",
    label: "Project root found",
    status: projectRoot ? "pass" : "fail",
    message: projectRoot ?? "No Android project root found.",
    suggestion: projectRoot ? undefined : "Run DroidDeck from an Android project directory."
  });

  if (projectRoot) {
    try {
      const loaded = await loadConfig(projectRoot);
      config = loaded.config;
      appModule = config.appModule;
      checks.push({ id: "config", label: "Config file valid", status: "pass", message: loaded.path ? "Config loaded." : "No config file; using defaults." });
    } catch (error) {
      checks.push({ id: "config", label: "Config file valid", status: "fail", message: error instanceof Error ? error.message : String(error) });
    }

    const project = await getProjectInfo(projectRoot, appModule, config?.projectName);
    checks.push({
      id: "gradlew",
      label: "Gradle wrapper exists",
      status: project.gradlewPath ? "pass" : "fail",
      message: project.gradlewPath ?? "./gradlew was not found."
    });
    checks.push({
      id: "settings",
      label: "Android project settings file exists",
      status: project.settingsPath ? "pass" : "fail",
      message: project.settingsPath ?? "settings.gradle/settings.gradle.kts was not found."
    });
    checks.push({
      id: "app-module",
      label: "App module detected",
      status: (await fs.pathExists(`${projectRoot}/${appModule}`)) ? "pass" : "warn",
      message: `Using module "${appModule}".`
    });

    try {
      tasksOutput = await loadGradleTasks(projectRoot, appModule);
      checks.push({ id: "gradle-tasks", label: "Gradle tasks can be loaded", status: "pass", message: "Gradle tasks loaded." });
      const variants = parseGradleTasks(tasksOutput, appModule);
      checks.push({
        id: "variants",
        label: "Variants discovered",
        status: variants.length > 0 ? "pass" : "fail",
        message: variants.length > 0 ? `${variants.length} variants discovered.` : "No Android variants discovered."
      });
      const selectedVariant = variants[0];
      checks.push({
        id: "application-id",
        label: "Application ID known for selected variant",
        status: selectedVariant && config?.applicationIds[selectedVariant.name] ? "pass" : "warn",
        message: selectedVariant
          ? config?.applicationIds[selectedVariant.name]
            ? `Application ID configured for ${selectedVariant.name}.`
            : `No application ID configured for ${selectedVariant.name}.`
          : "No selected variant."
      });
    } catch (error) {
      checks.push({ id: "gradle-tasks", label: "Gradle tasks can be loaded", status: "fail", message: error instanceof Error ? error.message : String(error) });
      checks.push({ id: "variants", label: "Variants discovered", status: "fail", message: "Skipped because Gradle tasks could not be loaded." });
      checks.push({ id: "application-id", label: "Application ID known for selected variant", status: "warn", message: "Skipped because variants were not discovered." });
    }

    try {
      const preferences = await loadPreferences();
      await savePreferences(preferences);
      checks.push({ id: "preferences", label: "User preferences readable/writable", status: "pass", message: preferencesFilePath() });
    } catch (error) {
      checks.push({ id: "preferences", label: "User preferences readable/writable", status: "fail", message: error instanceof Error ? error.message : String(error) });
    }
  } else {
    checks.push({ id: "config", label: "Config file valid", status: "warn", message: "Skipped because no project root was found." });
    checks.push({ id: "gradlew", label: "Gradle wrapper exists", status: "fail", message: "Skipped because no project root was found." });
    checks.push({ id: "settings", label: "Android project settings file exists", status: "fail", message: "Skipped because no project root was found." });
    checks.push({ id: "app-module", label: "App module detected", status: "fail", message: "Skipped because no project root was found." });
    checks.push({ id: "gradle-tasks", label: "Gradle tasks can be loaded", status: "fail", message: "Skipped because no project root was found." });
    checks.push({ id: "variants", label: "Variants discovered", status: "fail", message: "Skipped because no project root was found." });
    checks.push({ id: "preferences", label: "User preferences readable/writable", status: "warn", message: "Skipped because no project root was found." });
    checks.push({ id: "application-id", label: "Application ID known for selected variant", status: "warn", message: "Skipped because no project root was found." });
  }

  const adbAvailable = await isAdbAvailable();
  checks.push({
    id: "adb",
    label: "ADB available",
    status: adbAvailable ? "pass" : "fail",
    message: adbAvailable ? "adb is available." : "adb was not found on PATH."
  });

  const sdkAvailable = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
  checks.push({
    id: "android-sdk",
    label: "Android SDK environment likely available",
    status: sdkAvailable ? "pass" : "warn",
    message: sdkAvailable ? "Android SDK environment variable is set." : "ANDROID_HOME or ANDROID_SDK_ROOT is not set."
  });

  if (adbAvailable) {
    try {
      const devices = await listDevices(false);
      const online = devices.filter((device) => device.state === "device");
      checks.push({
        id: "devices",
        label: "Connected devices available",
        status: online.length > 0 ? "pass" : "warn",
        message: online.length > 0 ? `${online.length} online device(s).` : "No online devices found."
      });
    } catch (error) {
      checks.push({ id: "devices", label: "Connected devices available", status: "warn", message: error instanceof Error ? error.message : String(error) });
    }
  } else {
    checks.push({ id: "devices", label: "Connected devices available", status: "warn", message: "Skipped because adb is unavailable." });
  }

  return orderChecks(checks);
}

function orderChecks(checks: DoctorCheck[]): DoctorCheck[] {
  const order = [
    "macos",
    "node",
    "project-root",
    "gradlew",
    "settings",
    "app-module",
    "gradle-tasks",
    "variants",
    "adb",
    "android-sdk",
    "devices",
    "config",
    "preferences",
    "application-id"
  ];
  return order.map((id) => checks.find((check) => check.id === id)).filter((check): check is DoctorCheck => Boolean(check));
}
