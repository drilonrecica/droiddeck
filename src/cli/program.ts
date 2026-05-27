import { Command } from "commander";
import { doctorCommand } from "./commands/doctor.js";
import {
  clearCommand,
  deviceCommand,
  devicesCommand,
  killCommand,
  launchCommand,
  logsCommand,
  runCommand,
  screenshotCommand,
  testCommand,
  uninstallCommand,
  useCommand,
  variantsCommand
} from "./commands/stubs.js";

export async function runProgram(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name("droiddeck")
    .description("Terminal dashboard and CLI command center for native Android development.")
    .version("0.1.0")
    .action(() => {
      console.log("DroidDeck TUI dashboard is not implemented yet.");
    });

  program.command("doctor").description("Run project and environment checks.").action(doctorCommand);
  program.command("variants").description("Print discovered Android variants.").action(variantsCommand);
  program.command("devices").description("Print connected Android devices.").action(devicesCommand);
  program.command("use").argument("<variantOrAlias>").description("Persist selected variant for this project.").action(useCommand);
  program.command("device").argument("<deviceId>").description("Persist selected device for this project.").action(deviceCommand);
  program.command("run").argument("[variantOrAlias]").description("Install and launch a variant.").action(runCommand);
  program.command("logs").argument("[variantOrAlias]").description("Stream filtered logcat output.").action(logsCommand);
  program.command("test").argument("[variantOrAlias]").description("Run tests for a variant.").action(testCommand);
  program.command("clear").argument("[variantOrAlias]").description("Clear app data.").action(clearCommand);
  program.command("launch").argument("[variantOrAlias]").description("Launch app.").action(launchCommand);
  program.command("kill").argument("[variantOrAlias]").description("Force-stop app.").action(killCommand);
  program.command("uninstall").argument("[variantOrAlias]").description("Uninstall app.").action(uninstallCommand);
  program.command("screenshot").argument("[variantOrAlias]").description("Capture selected device screenshot.").action(screenshotCommand);

  await program.parseAsync(argv);
}
