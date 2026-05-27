import { captureScreenshot } from "../../core/screenshots.js";
import { resolveSelection } from "./shared.js";

export async function runScreenshotCommand(variantOrAlias: string | undefined, options: { device?: string }): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const filePath = await captureScreenshot(context.projectRoot, device, variant);
  console.log(filePath);
}
