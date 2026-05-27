import { Command } from "commander";
import { renderDashboard } from "./commands/dashboard.js";
import { runDoctorCommand } from "./commands/doctor.js";
import { runVariantsCommand } from "./commands/variants.js";
import { runDevicesCommand } from "./commands/devices.js";
import { runUseCommand } from "./commands/use.js";
import { runDeviceCommand } from "./commands/device.js";
import { runRunCommand } from "./commands/run.js";
import { runLogsCommand } from "./commands/logs.js";
import { runTestCommand } from "./commands/test.js";
import { runClearCommand } from "./commands/clear.js";
import { runLaunchCommand } from "./commands/launch.js";
import { runKillCommand } from "./commands/kill.js";
import { runUninstallCommand } from "./commands/uninstall.js";
import { runScreenshotCommand } from "./commands/screenshot.js";

export async function runProgram(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("droiddeck")
    .description("Terminal dashboard and CLI command center for native Android development.")
    .version("0.1.0")
    .action(() => renderDashboard());

  program.command("doctor").description("Run project and environment checks.").action(runDoctorCommand);
  program.command("variants").description("Print discovered Android variants.").action(runVariantsCommand);
  program.command("devices").description("Print connected Android devices.").action(runDevicesCommand);
  program.command("use").argument("<variantOrAlias>").description("Persist selected variant for this project.").action(runUseCommand);
  program.command("device").argument("<deviceId>").description("Persist selected device for this project.").action(runDeviceCommand);

  program
    .command("run")
    .argument("[variantOrAlias]")
    .option("--fresh", "Clear app data before launch.")
    .option("--clean", "Run Gradle clean first.")
    .option("--watch", "Keep logcat streaming after launch.")
    .option("--device <id>", "Use device for this run.")
    .description("Install and launch a variant.")
    .action(runRunCommand);

  program
    .command("logs")
    .argument("[variantOrAlias]")
    .option("--errors", "Show errors only.")
    .option("--warnings", "Show warnings and errors.")
    .option("--all", "Show all log lines.")
    .option("--device <id>", "Use device for logs.")
    .description("Stream filtered logcat output.")
    .action(runLogsCommand);

  program
    .command("test")
    .argument("[variantOrAlias]")
    .option("--all", "Reserved for all unit tests.")
    .option("--connected", "Reserved for connected Android tests.")
    .option("--open-report", "Open HTML report when available.")
    .description("Run unit tests for a variant.")
    .action(runTestCommand);

  program.command("clear").argument("[variantOrAlias]").option("--device <id>").description("Clear app data.").action(runClearCommand);
  program.command("launch").argument("[variantOrAlias]").option("--device <id>").description("Launch app.").action(runLaunchCommand);
  program.command("kill").argument("[variantOrAlias]").option("--device <id>").description("Force-stop app.").action(runKillCommand);
  program.command("uninstall").argument("[variantOrAlias]").option("--device <id>").option("--yes", "Confirm uninstall.").description("Uninstall app.").action(runUninstallCommand);
  program.command("screenshot").argument("[variantOrAlias]").option("--device <id>").description("Capture selected device screenshot.").action(runScreenshotCommand);

  await program.parseAsync(argv);
}
