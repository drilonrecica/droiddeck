import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { uninstallApp } from "../../core/appActions.js";
import { loadCommandContext, resolveContextApplicationId, resolveContextDevice, resolveContextVariant } from "../context.js";

export async function uninstallCommand(variantOrAlias: string | undefined, options: { device?: string; yes?: boolean }): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);
  const applicationId = await resolveContextApplicationId(context, variant);

  if (!options.yes) {
    const confirmed = await confirmUninstall(applicationId, device.id);
    if (!confirmed) {
      console.log("Uninstall cancelled.");
      return;
    }
  }

  await uninstallApp(device.id, applicationId);
  console.log(`Uninstalled ${applicationId} from ${device.id}.`);
}

export async function confirmUninstall(applicationId: string, deviceId: string): Promise<boolean> {
  const readline = createInterface({ input, output });
  try {
    const answer = await readline.question(`Uninstall ${applicationId} from ${deviceId}? Type "yes" to continue: `);
    return answer === "yes";
  } finally {
    readline.close();
  }
}

