import { clearAppData } from "../../core/appActions.js";
import { loadCommandContext, resolveContextApplicationId, resolveContextDevice, resolveContextVariant } from "../context.js";

export async function clearCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);
  const applicationId = await resolveContextApplicationId(context, variant);

  await clearAppData(device.id, applicationId);
  console.log(`Cleared app data for ${applicationId} on ${device.id}.`);
}

