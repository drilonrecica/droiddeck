import { resolveApplicationId } from "../../core/appIdResolver.js";
import { selectLogMode, streamLogcat } from "../../core/logcat.js";
import type { LogMode } from "../../types/config.js";
import { loadCommandContext, resolveContextDevice, resolveContextVariant } from "../context.js";

type LogsOptions = {
  errors?: boolean;
  warnings?: boolean;
  all?: boolean;
  device?: string;
};

export async function logsCommand(variantOrAlias: string | undefined, options: LogsOptions): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);
  const mode = selectLogMode(options, context.config.logcat.defaultMode);
  let applicationId: string | undefined;

  try {
    applicationId = await resolveApplicationId(context.config, variant, {
      projectRoot: context.projectRoot,
      appModule: context.config.appModule
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error("Continuing without app-specific PID filtering.");
  }

  await runLogStream(device.id, mode, context.config.logcat.tags, applicationId);
}

export async function runLogStream(deviceId: string, mode: LogMode, tags: readonly string[], applicationId?: string): Promise<void> {
  const stream = await streamLogcat({
    deviceId,
    applicationId,
    mode,
    tags,
    onWarning: (message) => console.error(`Warning: ${message}`),
    onLine: (line) => console.log(line.raw)
  });

  const stop = (): void => {
    stream.stop();
  };
  process.once("SIGINT", stop);

  try {
    const result = await stream.done;
    if (result.exitCode !== 0 && result.exitCode !== 143) {
      process.exitCode = result.exitCode || 1;
    }
  } finally {
    process.off("SIGINT", stop);
  }
}
