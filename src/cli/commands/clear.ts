import { applicationIdForSelection, clearApp, resolveSelection } from "./shared.js";

export async function runClearCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const applicationId = applicationIdForSelection(context, variant);
  await clearApp(device, applicationId);
  console.log(`Cleared app data for ${applicationId} on ${device.id}.`);
}
