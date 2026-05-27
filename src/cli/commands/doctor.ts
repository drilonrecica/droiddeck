import { doctorExitCode, formatDoctorCheck, runDoctor } from "../../core/doctor.js";

export async function doctorCommand(): Promise<void> {
  const checks = await runDoctor();

  for (const check of checks) {
    console.log(formatDoctorCheck(check));
    if (check.suggestion) {
      console.log(`  ${check.suggestion}`);
    }
  }

  const passed = checks.filter((check) => check.status === "pass").length;
  console.log(`\nDoctor: ${passed}/${checks.length} checks passed`);
  process.exitCode = doctorExitCode(checks);
}

