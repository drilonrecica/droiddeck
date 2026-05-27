import { launchApp } from "../../core/appActions.js";
import { loadCommandContext, resolveContextApplicationId, resolveContextDevice, resolveContextVariant } from "../context.js";

export async function launchCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);
  const applicationId = await resolveContextApplicationId(context, variant);

  await launchApp(context.config, device.id, applicationId);
  console.log(`Launched ${applicationId} on ${device.id}.`);
}

