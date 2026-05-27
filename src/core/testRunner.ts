import path from "node:path";
import fs from "fs-extra";
import open from "open";
import type { CommandResult } from "../types/command.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";
import { runGradle } from "./gradle.js";
import { normalizeModuleName } from "./paths.js";

export type OpenReport = (target: string) => Promise<unknown>;

export async function runUnitTests(projectRoot: string, variant: AndroidVariant, onLine?: (line: string) => void): Promise<CommandResult> {
  if (!variant.unitTestTask) {
    throw new DroidDeckError(`No unit test task found for variant "${variant.name}".`);
  }

  return runGradle(projectRoot, [variant.unitTestTask], onLine);
}

export function testReportPath(projectRoot: string, appModule: string, variant: AndroidVariant): string {
  return path.join(projectRoot, normalizeModuleName(appModule), "build", "reports", "tests", `test${variant.taskNamePart}UnitTest`, "index.html");
}

export async function openTestReportIfExists(
  projectRoot: string,
  appModule: string,
  variant: AndroidVariant,
  opener: OpenReport = open
): Promise<string | undefined> {
  const reportPath = testReportPath(projectRoot, appModule, variant);
  if (!(await fs.pathExists(reportPath))) {
    return undefined;
  }

  await opener(reportPath);
  return reportPath;
}

export function testStatusMessage(result: Pick<CommandResult, "exitCode">): "TESTS PASSED" | "TESTS FAILED" {
  return result.exitCode === 0 ? "TESTS PASSED" : "TESTS FAILED";
}

