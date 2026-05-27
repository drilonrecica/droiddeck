import path from "node:path";
import fs from "fs-extra";
import open from "open";
import type { AndroidVariant } from "../types/variant.js";
import { runGradleTask } from "./gradle.js";

export async function runUnitTests(projectRoot: string, variant: AndroidVariant, onLine?: (line: string) => void) {
  if (!variant.unitTestTask) {
    throw new Error(`No unit test task found for variant "${variant.name}".`);
  }
  return runGradleTask(projectRoot, [variant.unitTestTask], onLine);
}

export function testReportPath(projectRoot: string, appModule: string, variant: AndroidVariant): string {
  return path.join(projectRoot, appModule, "build", "reports", "tests", `test${variant.taskNamePart}UnitTest`, "index.html");
}

export async function openTestReportIfExists(projectRoot: string, appModule: string, variant: AndroidVariant): Promise<string | undefined> {
  const report = testReportPath(projectRoot, appModule, variant);
  if (!(await fs.pathExists(report))) {
    return undefined;
  }
  await open(report);
  return report;
}
