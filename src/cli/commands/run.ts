import { clearAppData, launchApp } from "../../core/appActions.js";
import { selectVariantBuildTask } from "../../core/buildWorkflow.js";
import { runGradle } from "../../core/gradle.js";
import { DroidDeckError } from "../../utils/errors.js";
import { loadCommandContext, resolveContextApplicationId, resolveContextDevice, resolveContextVariant } from "../context.js";
import { runLogStream } from "./logs.js";

type RunOptions = {
  fresh?: boolean;
  clean?: boolean;
  watch?: boolean;
  device?: string;
};

export async function runCommand(variantOrAlias: string | undefined, options: RunOptions): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);

  if (options.clean) {
    console.log("Running Gradle clean...");
    const clean = await runGradle(context.projectRoot, ["clean"], (line) => console.log(line));
    if (clean.exitCode !== 0) {
      throw new DroidDeckError("Gradle clean failed.", clean.outputLines.slice(-20).join("\n"));
    }
  }

  const buildTask = selectVariantBuildTask(variant);

  console.log(`Running ${buildTask.task}...`);
  const build = await runGradle(context.projectRoot, [buildTask.task], (line) => console.log(line));
  if (build.exitCode !== 0) {
    throw new DroidDeckError(`Gradle task failed: ${buildTask.task}`, build.outputLines.slice(-20).join("\n"));
  }

  if (!buildTask.installs) {
    console.log("Variant assembled, but no install task was found.");
    return;
  }

  let applicationId: string;
  try {
    applicationId = await resolveContextApplicationId(context, variant);
  } catch (error) {
    console.log("Install succeeded, but launch failed because the application ID could not be determined.");
    throw error;
  }

  if (options.fresh) {
    await clearAppData(device.id, applicationId);
    console.log(`Cleared app data for ${applicationId}.`);
  }

  await launchApp(context.config, device.id, applicationId);
  console.log(`Launched ${applicationId} on ${device.id}.`);

  if (options.watch) {
    await runLogStream(device.id, context.config.logcat.defaultMode, context.config.logcat.tags, applicationId);
  }
}
