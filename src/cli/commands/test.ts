import { openTestReportIfExists, runUnitTests, testReportPath, testStatusMessage } from "../../core/testRunner.js";
import { loadCommandContext, resolveContextVariant } from "../context.js";

type TestOptions = {
  all?: boolean;
  connected?: boolean;
  openReport?: boolean;
};

export async function testCommand(variantOrAlias: string | undefined, options: TestOptions): Promise<void> {
  if (options.all) {
    console.log("Not implemented yet: test --all is deferred to Phase 13.");
    process.exitCode = 1;
    return;
  }

  if (options.connected) {
    console.log("Not implemented yet: test --connected is deferred to Phase 13.");
    process.exitCode = 1;
    return;
  }

  const context = await loadCommandContext();
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

