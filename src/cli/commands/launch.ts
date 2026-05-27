import { applicationIdForSelection, launchApp, resolveSelection } from "./shared.js";

export async function runLaunchCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const applicationId = applicationIdForSelection(context, variant);
  await launchApp(context, device, applicationId);
  console.log(`Launched ${applicationId} on ${device.id}.`);
}
