import type { LogMode } from "../../types/config.js";
import { applicationIdForSelection, resolveSelection, streamLogs } from "./shared.js";

type LogsOptions = {
  errors?: boolean;
  warnings?: boolean;
  all?: boolean;
  device?: string;
};

export async function runLogsCommand(variantOrAlias: string | undefined, options: LogsOptions): Promise<void> {
  const { context, variant, device } = await resolveSelection(variantOrAlias, options.device);
  const mode: LogMode = options.errors ? "errors" : options.all ? "all" : options.warnings ? "warnings" : context.config.logcat.defaultMode;
  let applicationId: string | undefined;
  try {
    applicationId = applicationIdForSelection(context, variant);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
  }
  await streamLogs(device, applicationId, mode);
}
