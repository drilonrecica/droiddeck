import {
  openTestReportIfExists,
  runAllUnitTests,
  runConnectedTests,
  runUnitTests,
  testReportPath,
  testStatusMessage,
  unitTestTasks
} from "../../core/testRunner.js";
import { DroidDeckError } from "../../utils/errors.js";
import { loadCommandContext, resolveContextDevice, resolveContextVariant } from "../context.js";

type TestOptions = {
  all?: boolean;
  connected?: boolean;
  openReport?: boolean;
  device?: string;
};

export async function testCommand(variantOrAlias: string | undefined, options: TestOptions): Promise<void> {
  if (options.all && options.connected) {
    console.log("test --all --connected is not supported in MVP1.");
    process.exitCode = 1;
    return;
  }

  if (options.connected) {
    await connectedTestCommand(variantOrAlias, options);
    return;
  }

  const context = await loadCommandContext();

  if (options.all) {
    const tasks = unitTestTasks(context.variants);
    if (tasks.length === 0) {
      throw new DroidDeckError("No unit test tasks were discovered.");
    }
    console.log(`Running ${tasks.length} unit test task(s)...`);
    const result = await runAllUnitTests(context.projectRoot, context.variants, (line) => console.log(line));
    console.log(testStatusMessage(result));
    if (result.exitCode !== 0) {
      process.exitCode = result.exitCode || 1;
    }
    return;
  }

  const variant = resolveContextVariant(context, variantOrAlias);
  const result = await runUnitTests(context.projectRoot, variant, (line) => console.log(line));
  const reportPath = testReportPath(context.projectRoot, context.config.appModule, variant);

  console.log(testStatusMessage(result));
  console.log(`Report: ${reportPath}`);

  if (options.openReport) {
    const openedReportPath = await openTestReportIfExists(context.projectRoot, context.config.appModule, variant);
    if (!openedReportPath) {
      console.log("Test report was not found.");
    }
  }

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode || 1;
  }
}

async function connectedTestCommand(variantOrAlias: string | undefined, options: TestOptions): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveContextVariant(context, variantOrAlias);
  const device = await resolveContextDevice(context, options.device);

  console.log(`Running connected tests for ${variant.name} on ${device.id}...`);
  const result = await runConnectedTests(context.projectRoot, variant, (line) => console.log(line));
  console.log(testStatusMessage(result));

  if (result.exitCode !== 0) {
    process.exitCode = result.exitCode || 1;
  }
}
