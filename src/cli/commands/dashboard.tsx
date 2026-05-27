import React from "react";
import { render } from "ink";
import { registerProcessCleanupHandlers, stopTrackedProcesses, waitForTrackedProcesses } from "../../core/processRunner.js";
import { App } from "../../tui/App.js";

export async function dashboardCommand(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("DroidDeck TUI requires an interactive terminal.");
    process.exitCode = 1;
    return;
  }

  const unregisterCleanup = registerProcessCleanupHandlers();
  const instance = render(<App />);
  try {
    await instance.waitUntilExit();
  } finally {
    stopTrackedProcesses();
    await waitForTrackedProcesses();
    unregisterCleanup();
  }
}
