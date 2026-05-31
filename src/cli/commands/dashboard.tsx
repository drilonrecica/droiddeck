import { CliRenderEvents, createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { registerProcessCleanupHandlers, stopTrackedProcesses, waitForTrackedProcesses } from "../../core/processRunner.js";
import { App } from "../../tui/App.js";

export async function dashboardCommand(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("DroidDeck TUI requires an interactive terminal.");
    process.exitCode = 1;
    return;
  }

  const unregisterCleanup = registerProcessCleanupHandlers();
  const renderer = await createCliRenderer({
    screenMode: "alternate-screen",
    exitOnCtrlC: true,
    consoleMode: "disabled"
  });
  const root = createRoot(renderer);
  const waitForDestroy = new Promise<void>((resolve) => {
    renderer.once(CliRenderEvents.DESTROY, () => resolve());
  });
  root.render(<App />);

  try {
    await waitForDestroy;
  } finally {
    root.unmount();
    if (!renderer.isDestroyed) {
      renderer.destroy();
    }
    stopTrackedProcesses();
    await waitForTrackedProcesses();
    unregisterCleanup();
  }
}
