import path from "node:path";
import fs from "fs-extra";
import type { DoctorCheck } from "../types/doctor.js";
import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidVariant } from "../types/variant.js";
import { isAdbAvailable } from "./adb.js";
import { loadConfig } from "./config.js";
import { listDevices } from "./devices.js";
import { hasGradleWrapperJar, isGradleWrapperExecutable, loadGradleTasks } from "./gradle.js";
import { preferencesFilePath } from "./paths.js";
import { emptyPreferences, getProjectPreferences, loadPreferences, savePreferences } from "./preferences.js";
import { findProjectRoot, getProjectInfo } from "./projectDetector.js";
import { runCommand } from "./processRunner.js";
import { parseGradleTasks } from "./variantDiscovery.js";

type CommandRunner = typeof runCommand;

export type DoctorOptions = {
  startDir?: string;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  nodeVersion?: string;
  preferencesPath?: string;
  commandRunner?: CommandRunner;
};

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const nodeVersion = options.nodeVersion ?? process.versions.node;
  const commandRunner = options.commandRunner ?? runCommand;
  const startDir = options.startDir ?? process.cwd();
  const projectRoot = await findProjectRoot(startDir);
  const preferencesPath = options.preferencesPath ?? preferencesFilePath();
  let config: DroidDeckConfig | undefined;
  let variants: AndroidVariant[] = [];

  checks.push(checkMacos(platform));
  checks.push(checkNodeVersion(nodeVersion));

  checks.push({
    id: "project-root",
    label: "Project root found",
    status: projectRoot ? "pass" : "fail",
    message: projectRoot ?? "No Android project root found.",
    suggestion: projectRoot ? undefined : "Run DroidDeck from an Android project directory."
  });

  if (projectRoot) {
    try {
      const loadedConfig = await loadConfig(projectRoot);
      config = loadedConfig.config;
      checks.push({
        id: "config",
        label: "Config file valid",
        status: "pass",
        message: loadedConfig.path ? `Loaded ${loadedConfig.path}.` : "No config file found; using defaults."
      });
    } catch (error) {
      checks.push({
        id: "config",
        label: "Config file valid",
        status: "fail",
        message: toMessage(error),
        suggestion: "Fix droiddeck.config.json or remove it to use defaults."
      });
    }

    const project = await getProjectInfo(projectRoot, config?.appModule ?? "app", config?.projectName);
    const wrapperExists = Boolean(project.gradlewPath);

    checks.push({
      id: "gradle-wrapper",
      label: "Gradle wrapper exists",
      status: wrapperExists ? "pass" : "fail",
      message: project.gradlewPath ?? "./gradlew was not found.",
      suggestion: wrapperExists ? undefined : "DroidDeck MVP1 requires the Android project's Gradle wrapper."
    });

    let wrapperExecutable = false;
    let wrapperJarExists = false;
    if (wrapperExists) {
      wrapperExecutable = await isGradleWrapperExecutable(projectRoot);
      checks.push({
        id: "gradle-wrapper-executable",
        label: "Gradle wrapper executable",
        status: wrapperExecutable ? "pass" : "fail",
        message: wrapperExecutable ? "./gradlew is executable." : "./gradlew is not executable.",
        suggestion: wrapperExecutable ? undefined : "Run chmod +x ./gradlew."
      });
    } else {
      checks.push({
        id: "gradle-wrapper-executable",
        label: "Gradle wrapper executable",
        status: "fail",
        message: "Skipped because ./gradlew was not found."
      });
    }

    if (wrapperExists) {
      wrapperJarExists = await hasGradleWrapperJar(projectRoot);
      checks.push({
        id: "gradle-wrapper-jar",
        label: "Gradle wrapper JAR exists",
        status: wrapperJarExists ? "pass" : "fail",
        message: wrapperJarExists ? "gradle/wrapper/gradle-wrapper.jar exists." : "gradle/wrapper/gradle-wrapper.jar was not found.",
        suggestion: wrapperJarExists ? undefined : "Restore gradle-wrapper.jar or regenerate the wrapper in the Android project."
      });
    } else {
      checks.push({
        id: "gradle-wrapper-jar",
        label: "Gradle wrapper JAR exists",
        status: "fail",
        message: "Skipped because ./gradlew was not found."
      });
    }

    checks.push({
      id: "settings-file",
      label: "Android project settings file exists",
      status: project.settingsPath ? "pass" : "fail",
      message: project.settingsPath ?? "settings.gradle or settings.gradle.kts was not found."
    });

    const modulePath = path.join(projectRoot, project.appModule);
    const moduleExists = await fs.pathExists(modulePath);
    checks.push({
      id: "app-module",
      label: "App module detected",
      status: moduleExists ? "pass" : "warn",
      message: moduleExists ? `Using module "${project.appModule}".` : `Module directory "${project.appModule}" was not found.`,
      suggestion: moduleExists ? undefined : "Set appModule in droiddeck.config.json if your Android app module has a different name."
    });

    if (wrapperExists && wrapperExecutable && wrapperJarExists) {
      try {
        const tasksOutput = await loadGradleTasks(projectRoot, project.appModule);
        variants = parseGradleTasks(tasksOutput, project.appModule);
        checks.push({
          id: "gradle-tasks",
          label: "Gradle tasks can be loaded",
          status: "pass",
          message: "Gradle tasks loaded."
        });
        checks.push({
          id: "variants",
          label: "Variants discovered",
          status: variants.length > 0 ? "pass" : "fail",
          message: variants.length > 0 ? `${variants.length} variant(s) discovered.` : "No Android variants were discovered."
        });
      } catch (error) {
        checks.push({
          id: "gradle-tasks",
          label: "Gradle tasks can be loaded",
          status: "fail",
          message: toMessage(error),
          suggestion: "Check that the configured Android module exists and Gradle can load tasks."
        });
        checks.push({
          id: "variants",
          label: "Variants discovered",
          status: "fail",
          message: "Skipped because Gradle tasks could not be loaded."
        });
      }
    } else {
      checks.push({
        id: "gradle-tasks",
        label: "Gradle tasks can be loaded",
        status: "fail",
        message: "Skipped because the Gradle wrapper is unavailable, incomplete, or not executable."
      });
      checks.push({
        id: "variants",
        label: "Variants discovered",
        status: "fail",
        message: "Skipped because Gradle tasks could not be loaded."
      });
    }

    checks.push(await checkApplicationId(projectRoot, config, variants, preferencesPath));
  } else {
    checks.push(...projectSkippedChecks());
  }

  checks.push(await checkAdbAvailable(commandRunner));
  checks.push(checkAndroidSdk(env));
  checks.push(await checkConnectedDevices(commandRunner));
  checks.push(await checkPreferences(preferencesPath));

  return orderDoctorChecks(checks);
}

export function hasFailingChecks(checks: readonly DoctorCheck[]): boolean {
  return checks.some((check) => check.status === "fail");
}

export function doctorExitCode(checks: readonly DoctorCheck[]): 0 | 1 {
  return hasFailingChecks(checks) ? 1 : 0;
}

export function formatDoctorCheck(check: DoctorCheck): string {
  const prefix = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
  return `${prefix} ${check.label}: ${check.message}`;
}

function checkMacos(platform: NodeJS.Platform): DoctorCheck {
  return {
    id: "macos",
    label: "macOS detected",
    status: platform === "darwin" ? "pass" : "fail",
    message: platform === "darwin" ? "Running on macOS." : `Running on ${platform}; MVP1 supports macOS only.`
  };
}

function checkNodeVersion(nodeVersion: string): DoctorCheck {
  const majorVersion = Number(nodeVersion.split(".")[0]);
  return {
    id: "node-version",
    label: "Node.js version supported",
    status: majorVersion >= 20 ? "pass" : "fail",
    message: `Node.js ${nodeVersion}`,
    suggestion: majorVersion >= 20 ? undefined : "Install Node.js 20 or newer."
  };
}

async function checkAdbAvailable(commandRunner: CommandRunner): Promise<DoctorCheck> {
  const available = await isAdbAvailable(commandRunner);
  return {
    id: "adb",
    label: "ADB available",
    status: available ? "pass" : "fail",
    message: available ? "adb is available." : "adb was not found on PATH.",
    suggestion: available ? undefined : "Install Android SDK platform-tools and ensure adb is on PATH."
  };
}

function checkAndroidSdk(env: NodeJS.ProcessEnv): DoctorCheck {
  const sdkRoot = env.ANDROID_HOME || env.ANDROID_SDK_ROOT;
  return {
    id: "android-sdk",
    label: "Android SDK environment likely available",
    status: sdkRoot ? "pass" : "warn",
    message: sdkRoot ? `Android SDK environment is set: ${sdkRoot}` : "ANDROID_HOME or ANDROID_SDK_ROOT is not set.",
    suggestion: sdkRoot ? undefined : "Set ANDROID_HOME or ANDROID_SDK_ROOT if Android SDK tools are not on PATH."
  };
}

async function checkConnectedDevices(commandRunner: CommandRunner): Promise<DoctorCheck> {
  try {
    const devices = await listDevices(false, commandRunner);
    const onlineDeviceCount = devices.filter((device) => device.state === "device").length;
    return {
      id: "connected-devices",
      label: "Connected devices available",
      status: onlineDeviceCount > 0 ? "pass" : "warn",
      message: onlineDeviceCount > 0 ? `${onlineDeviceCount} online device(s).` : "No online devices found.",
      suggestion: onlineDeviceCount > 0 ? undefined : "Start an emulator or connect a device."
    };
  } catch {
    return {
      id: "connected-devices",
      label: "Connected devices available",
      status: "warn",
      message: "Skipped because adb is unavailable."
    };
  }
}

async function checkPreferences(filePath: string): Promise<DoctorCheck> {
  try {
    const preferences = await loadPreferences(filePath);
    await savePreferences(preferences, filePath);
    return {
      id: "preferences",
      label: "User preferences readable/writable",
      status: "pass",
      message: filePath
    };
  } catch (error) {
    return {
      id: "preferences",
      label: "User preferences readable/writable",
      status: "fail",
      message: toMessage(error),
      suggestion: "Check permissions for ~/.droiddeck/preferences.json."
    };
  }
}

async function checkApplicationId(
  projectRoot: string,
  config: DroidDeckConfig | undefined,
  variants: readonly AndroidVariant[],
  preferencesPath: string
): Promise<DoctorCheck> {
  if (!config || variants.length === 0) {
    return {
      id: "application-id",
      label: "Application ID known for selected variant",
      status: "warn",
      message: "Skipped because config or variants are unavailable."
    };
  }

  const preferences = await loadPreferences(preferencesPath).catch(() => emptyPreferences());
  const projectPreferences = getProjectPreferences(preferences, projectRoot);
  const selectedVariant = variants.find((variant) => variant.name === projectPreferences.lastVariant) ?? variants[0];

  if (!selectedVariant) {
    return {
      id: "application-id",
      label: "Application ID known for selected variant",
      status: "warn",
      message: "No selected or discovered variant."
    };
  }

  const applicationId = config.applicationIds[selectedVariant.name];
  return {
    id: "application-id",
    label: "Application ID known for selected variant",
    status: applicationId ? "pass" : "warn",
    message: applicationId ? `Application ID configured for ${selectedVariant.name}.` : `No application ID configured for ${selectedVariant.name}.`,
    suggestion: applicationId ? undefined : "Add applicationIds to droiddeck.config.json for app-specific actions."
  };
}

function projectSkippedChecks(): DoctorCheck[] {
  return [
    {
      id: "config",
      label: "Config file valid",
      status: "warn",
      message: "Skipped because no project root was found."
    },
    {
      id: "gradle-wrapper",
      label: "Gradle wrapper exists",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "gradle-wrapper-executable",
      label: "Gradle wrapper executable",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "gradle-wrapper-jar",
      label: "Gradle wrapper JAR exists",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "settings-file",
      label: "Android project settings file exists",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "app-module",
      label: "App module detected",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "gradle-tasks",
      label: "Gradle tasks can be loaded",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "variants",
      label: "Variants discovered",
      status: "fail",
      message: "Skipped because no project root was found."
    },
    {
      id: "application-id",
      label: "Application ID known for selected variant",
      status: "warn",
      message: "Skipped because no project root was found."
    }
  ];
}

function orderDoctorChecks(checks: DoctorCheck[]): DoctorCheck[] {
  const order = [
    "macos",
    "node-version",
    "project-root",
    "gradle-wrapper",
    "gradle-wrapper-executable",
    "gradle-wrapper-jar",
    "settings-file",
    "app-module",
    "gradle-tasks",
    "variants",
    "adb",
    "android-sdk",
    "connected-devices",
    "config",
    "preferences",
    "application-id"
  ];

  return order.map((id) => checks.find((check) => check.id === id)).filter((check): check is DoctorCheck => Boolean(check));
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
