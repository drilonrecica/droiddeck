import { Command } from "commander";
import { clearCommand } from "./commands/clear.js";
import { dashboardCommand } from "./commands/dashboard.js";
import { deviceCommand } from "./commands/device.js";
import { devicesCommand } from "./commands/devices.js";
import { doctorCommand } from "./commands/doctor.js";
import { killCommand } from "./commands/kill.js";
import { launchCommand } from "./commands/launch.js";
import { logsCommand } from "./commands/logs.js";
import { runCommand } from "./commands/run.js";
import { screenshotCommand } from "./commands/screenshot.js";
import { testCommand } from "./commands/test.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { useCommand } from "./commands/use.js";
import { variantsCommand } from "./commands/variants.js";

export async function runProgram(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("droiddeck")
    .description("Terminal dashboard and CLI command center for native Android development.")
    .version("0.1.0")
    .action(dashboardCommand);

  program.command("doctor").description("Run project and environment checks.").action(doctorCommand);
  program.command("variants").description("Print discovered Android variants.").action(variantsCommand);
  program.command("devices").description("Print connected Android devices.").action(devicesCommand);
  program.command("use").argument("<variantOrAlias>").description("Persist selected variant for this project.").action(useCommand);
  program.command("device").argument("<deviceId>").description("Persist selected device for this project.").action(deviceCommand);
  program
    .command("run")
    .argument("[variantOrAlias]")
    .option("--fresh", "Clear app data before launch.")
    .option("--clean", "Run Gradle clean first.")
    .option("--watch", "Keep logs open after launch.")
    .option("--device <id>", "Use device for this run.")
    .description("Install and launch a variant.")
    .action(runCommand);
  program
    .command("logs")
    .argument("[variantOrAlias]")
    .option("--errors", "Show errors only.")
    .option("--warnings", "Show warnings and errors.")
    .option("--all", "Show all log lines.")
    .option("--device <id>", "Use device for logs.")
    .description("Stream filtered logcat output.")
    .action(logsCommand);
  program
    .command("test")
    .argument("[variantOrAlias]")
    .option("--all", "Run all discovered unit test tasks.")
    .option("--connected", "Run selected variant connected Android tests.")
    .option("--open-report", "Open HTML report when available.")
    .option("--device <id>", "Use device for connected tests.")
    .description("Run tests for a variant.")
    .action(testCommand);
  program.command("clear").argument("[variantOrAlias]").option("--device <id>").description("Clear app data.").action(clearCommand);
  program.command("launch").argument("[variantOrAlias]").option("--device <id>").description("Launch app.").action(launchCommand);
  program.command("kill").argument("[variantOrAlias]").option("--device <id>").description("Force-stop app.").action(killCommand);
  program
    .command("uninstall")
    .argument("[variantOrAlias]")
    .option("--device <id>")
    .option("--yes", "Confirm uninstall.")
    .description("Uninstall app.")
    .action(uninstallCommand);
  program.command("screenshot").argument("[variantOrAlias]").option("--device <id>").description("Capture selected device screenshot.").action(screenshotCommand);

  await program.parseAsync(argv);
}
