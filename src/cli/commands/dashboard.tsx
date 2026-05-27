import React from "react";
import { render } from "ink";
import { App } from "../../tui/App.js";

export async function dashboardCommand(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("DroidDeck TUI requires an interactive terminal.");
    process.exitCode = 1;
    return;
  }

  const instance = render(<App />);
  await instance.waitUntilExit();
}
