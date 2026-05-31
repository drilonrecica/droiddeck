#!/usr/bin/env bun
import { runProgram } from "./cli/program.js";

runProgram(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
