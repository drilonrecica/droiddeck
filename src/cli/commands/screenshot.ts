import { captureScreenshot } from "../../core/screenshots.js";
import { loadCommandContext, resolveContextDevice, resolveContextVariant } from "../context.js";

export async function screenshotCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);
  const filePath = await captureScreenshot(context.projectRoot, device, variant);

  console.log(filePath);
}

