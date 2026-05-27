import chalk from "chalk";
import { runDoctor } from "../../core/doctor.js";
import type { DoctorCheck } from "../../types/doctor.js";

export async function runDoctorCommand(): Promise<void> {
  const checks = await runDoctor();
  const failCount = checks.filter((check) => check.status === "fail").length;

  for (const check of checks) {
    console.log(formatCheck(check));
    if (check.suggestion) {
      console.log(chalk.dim(`  ${check.suggestion}`));
    }
  }

  const passed = checks.filter((check) => check.status === "pass").length;
  console.log(`\nDoctor: ${passed}/${checks.length} checks passed`);
  if (failCount > 0) {
    process.exitCode = 1;
  }
}

export function formatCheck(check: DoctorCheck): string {
  const marker = check.status === "pass" ? chalk.green("✓") : check.status === "warn" ? chalk.yellow("⚠") : chalk.red("✗");
  return `${marker} ${check.label}: ${check.message}`;
}
