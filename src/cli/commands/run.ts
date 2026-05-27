import { applicationIdForSelection, clearApp, installVariant, launchApp, resolveSelection, streamLogs } from "./shared.js";

type RunOptions = {
  fresh?: boolean;
  clean?: boolean;
  watch?: boolean;
  device?: string;
};

export async function runRunCommand(variantOrAlias: string | undefined, options: RunOptions): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const installResult = await installVariant(context, variant, Boolean(options.clean));
  if (!installResult.installed) {
    return;
  }

  const applicationId = applicationIdForSelection(context, variant);
  if (options.fresh) {
    await clearApp(device, applicationId);
    console.log("App data cleared.");
  }
  await launchApp(context, device, applicationId);
  console.log(`Launched ${applicationId} on ${device.id}.`);

  if (options.watch) {
    await streamLogs(device, applicationId, context.config.logcat.defaultMode);
  }
}
