import { execa, type Options } from "execa";
import type { BinaryCommandResult, CommandResult } from "../types/command.js";

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

export async function runCommandBinary(file: string, args: readonly string[] = [], options: RunCommandOptions = {}): Promise<BinaryCommandResult> {
  const command = [file, ...args].join(" ");
  const result = await execa(file, [...args], {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    reject: options.reject ?? false,
    encoding: "buffer"
  });
  const stderr = toBuffer(result.stderr).toString("utf8");

  return {
    command,
    exitCode: result.exitCode ?? 0,
    stdout: toBuffer(result.stdout),
    stderr,
    outputLines: splitLines(stderr)
  };
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).filter((line) => line.length > 0);
}

function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  if (typeof value === "string") {
    return Buffer.from(value);
  }
  return Buffer.alloc(0);
}
