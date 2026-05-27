import { openTestReportIfExists, runUnitTests, testReportPath } from "../../core/testRunner.js";
import { resolveVariant } from "../../core/variantResolver.js";
import { loadCommandContext } from "../context.js";

type TestOptions = {
  all?: boolean;
  connected?: boolean;
  openReport?: boolean;
};

export async function runTestCommand(variantOrAlias: string | undefined, options: TestOptions): Promise<void> {
  const context = await loadCommandContext();
  const variant = resolveVariant(context.variants, context.config.variantAliases, variantOrAlias, context.preferences.lastVariant);
  const result = await runUnitTests(context.projectRoot, variant, (line) => console.log(line));
  const report = testReportPath(context.projectRoot, context.config.appModule, variant);

  if (result.exitCode === 0) {
    console.log("TESTS PASSED");
  } else {
    console.log("TESTS FAILED");
    process.exitCode = result.exitCode || 1;
  }
  console.log(`Report: ${report}`);

  if (options.openReport) {
    const opened = await openTestReportIfExists(context.projectRoot, context.config.appModule, variant);
    if (!opened) {
      console.log("Test report was not found.");
    }
  }
}
