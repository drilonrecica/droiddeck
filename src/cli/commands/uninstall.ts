import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { applicationIdForSelection, resolveSelection, uninstallApp } from "./shared.js";

export async function runUninstallCommand(variantOrAlias: string | undefined, options: { device?: string; yes?: boolean }): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const applicationId = applicationIdForSelection(context, variant);

  if (!options.yes) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question(`Uninstall ${applicationId} from ${device.id}? Type "yes" to continue: `);
    rl.close();
    if (answer !== "yes") {
      console.log("Uninstall cancelled.");
      return;
    }
  }

  await uninstallApp(device, applicationId);
  console.log(`Uninstalled ${applicationId} from ${device.id}.`);
}
