import { execa, type Options } from "execa";
import type { CommandResult } from "../types/command.js";

export type RunCommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  reject?: boolean;
  onLine?: (line: string) => void;
};

export async function runCommand(file: string, args: readonly string[] = [], options: RunCommandOptions = {}): Promise<CommandResult> {
  const command = [file, ...args].join(" ");
  const outputLines: string[] = [];
  const execaOptions: Options = {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    reject: options.reject ?? false,
    all: true
  };

  const subprocess = execa(file, [...args], execaOptions);
  subprocess.all?.on("data", (chunk: Buffer) => {
    for (const line of splitLines(chunk.toString())) {
      outputLines.push(line);
      options.onLine?.(line);
    }
  });

  const result = await subprocess;
  const stdout = typeof result.stdout === "string" ? result.stdout : "";
  const stderr = typeof result.stderr === "string" ? result.stderr : "";

  return {
    command,
    exitCode: result.exitCode ?? 0,
    stdout,
    stderr,
    outputLines: outputLines.length > 0 ? outputLines : splitLines([stdout, stderr].filter(Boolean).join("\n"))
  };
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).filter((line) => line.length > 0);
}

