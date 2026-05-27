import path from "node:path";
import fs from "fs-extra";
import { runCommand } from "./processRunner.js";
import { moduleTaskPrefix } from "./paths.js";
import { DroidDeckError } from "../utils/errors.js";

export async function requireGradleWrapper(projectRoot: string): Promise<string> {
  const gradlewPath = path.join(projectRoot, "gradlew");
  if (!(await fs.pathExists(gradlewPath))) {
    throw new DroidDeckError("Gradle wrapper not found.", "Run DroidDeck from an Android project with ./gradlew.");
  }
  return "./gradlew";
}

export async function loadGradleTasks(projectRoot: string, appModule: string): Promise<string> {
  await requireGradleWrapper(projectRoot);
  const result = await runCommand("./gradlew", [`${moduleTaskPrefix(appModule)}tasks`, "--all"], {
    cwd: projectRoot
  });
  if (result.exitCode !== 0) {
    throw new DroidDeckError(
      "Could not load Gradle tasks.",
      result.outputLines.slice(-20).join("\n") || "Check that the configured Android module exists."
    );
  }
  return result.stdout || result.outputLines.join("\n");
}

export async function runGradleTask(projectRoot: string, args: string[], onLine?: (line: string) => void) {
  await requireGradleWrapper(projectRoot);
  return runCommand("./gradlew", args, { cwd: projectRoot, onLine });
}
