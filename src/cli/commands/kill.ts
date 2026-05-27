import { applicationIdForSelection, killApp, resolveSelection } from "./shared.js";

export async function runKillCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const applicationId = applicationIdForSelection(context, variant);
  await killApp(device, applicationId);
  console.log(`Stopped ${applicationId} on ${device.id}.`);
}
