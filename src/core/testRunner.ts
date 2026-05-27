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

export async function runAllUnitTests(projectRoot: string, variants: readonly AndroidVariant[], onLine?: (line: string) => void): Promise<CommandResult> {
  const tasks = unitTestTasks(variants);
  if (tasks.length === 0) {
    throw new DroidDeckError("No unit test tasks were discovered.");
  }

  return runGradle(projectRoot, tasks, onLine);
}

export async function runConnectedTests(projectRoot: string, variant: AndroidVariant, onLine?: (line: string) => void): Promise<CommandResult> {
  if (!variant.connectedTestTask) {
    throw new DroidDeckError(`No connected Android test task found for variant "${variant.name}".`);
  }

  return runGradle(projectRoot, [variant.connectedTestTask], onLine);
}

export function unitTestTasks(variants: readonly AndroidVariant[]): string[] {
  return variants.map((variant) => variant.unitTestTask).filter((task): task is string => Boolean(task));
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
