import path from "node:path";
import fs from "fs-extra";
import type { CommandResult } from "../types/command.js";
import { DroidDeckError } from "../utils/errors.js";
import { moduleTaskPrefix } from "./paths.js";
import { runCommand } from "./processRunner.js";

export async function requireGradleWrapper(projectRoot: string): Promise<string> {
  const gradlewPath = path.join(projectRoot, "gradlew");
  if (!(await fs.pathExists(gradlewPath))) {
    throw new DroidDeckError("Gradle wrapper not found.", "DroidDeck MVP1 requires the Android project's ./gradlew wrapper.");
  }

  const wrapperJarPath = gradleWrapperJarPath(projectRoot);
  if (!(await fs.pathExists(wrapperJarPath))) {
    throw new DroidDeckError(
      "Gradle wrapper JAR not found.",
      "The Android project's gradle/wrapper/gradle-wrapper.jar is missing. Restore it or regenerate the Gradle wrapper in that project."
    );
  }

  return gradlewPath;
}

export function gradleWrapperJarPath(projectRoot: string): string {
  return path.join(projectRoot, "gradle", "wrapper", "gradle-wrapper.jar");
}

export async function hasGradleWrapperJar(projectRoot: string): Promise<boolean> {
  return fs.pathExists(gradleWrapperJarPath(projectRoot));
}

export async function isGradleWrapperExecutable(projectRoot: string): Promise<boolean> {
  const gradlewPath = path.join(projectRoot, "gradlew");
  if (!(await fs.pathExists(gradlewPath))) {
    return false;
  }

  try {
    await fs.access(gradlewPath, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function loadGradleTasks(projectRoot: string, appModule: string): Promise<string> {
  await requireGradleWrapper(projectRoot);

  const result = await runGradle(projectRoot, [`${moduleTaskPrefix(appModule)}tasks`, "--all"]);
  if (result.exitCode !== 0) {
    throw new DroidDeckError("Could not load Gradle tasks.", formatCommandFailure(result));
  }

  return result.stdout || result.outputLines.join("\n");
}

export async function runGradle(projectRoot: string, args: readonly string[], onLine?: (line: string) => void): Promise<CommandResult> {
  await requireGradleWrapper(projectRoot);
  return runCommand("./gradlew", args, { cwd: projectRoot, onLine });
}

export function formatCommandFailure(result: CommandResult, maxLines = 20): string {
  const details = result.outputLines.slice(-maxLines).join("\n");
  return [`Command: ${result.command}`, `Exit code: ${result.exitCode}`, details].filter(Boolean).join("\n");
}
