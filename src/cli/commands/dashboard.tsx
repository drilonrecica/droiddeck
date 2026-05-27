import React from "react";
import { render } from "ink";
import { App } from "../../tui/App.js";

export async function renderDashboard(): Promise<void> {
  render(<App />);
}
