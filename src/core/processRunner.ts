import { execa, type Options } from "execa";
import type { BinaryCommandResult, CommandResult } from "../types/command.js";

const DEFAULT_MAX_OUTPUT_LINES = 500;

type TrackableSubprocess = {
  pid?: number;
  killed?: boolean;
  kill: (signal?: NodeJS.Signals) => boolean;
  then: Promise<unknown>["then"];
};

const trackedProcesses = new Map<TrackableSubprocess, Promise<unknown>>();
let cleanupHandlersRegistered = false;

export type RunCommandOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  input?: string;
  reject?: boolean;
  onLine?: (line: string) => void;
  maxOutputLines?: number;
};

export type StreamingCommand = {
  command: string;
  done: Promise<CommandResult>;
  stop: () => void;
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

  const subprocess = trackSubprocess(execa(file, [...args], execaOptions));
  subprocess.all?.on("data", (chunk: Buffer) => {
    for (const line of splitLines(chunk.toString())) {
      pushBounded(outputLines, line, options.maxOutputLines ?? DEFAULT_MAX_OUTPUT_LINES);
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

export function streamCommand(file: string, args: readonly string[] = [], options: RunCommandOptions = {}): StreamingCommand {
  const command = [file, ...args].join(" ");
  const outputLines: string[] = [];
  const subprocess = trackSubprocess(execa(file, [...args], {
    cwd: options.cwd,
    env: options.env,
    reject: options.reject ?? false,
    all: true
  }));

  subprocess.all?.on("data", (chunk: Buffer) => {
    for (const line of splitLines(chunk.toString())) {
      pushBounded(outputLines, line, options.maxOutputLines ?? DEFAULT_MAX_OUTPUT_LINES);
      options.onLine?.(line);
    }
  });

  return {
    command,
    done: subprocess.then((result) => ({
      command,
      exitCode: result.exitCode ?? 0,
      stdout: typeof result.stdout === "string" ? result.stdout : "",
      stderr: typeof result.stderr === "string" ? result.stderr : "",
      outputLines
    })),
    stop: () => {
      stopSubprocess(subprocess);
    }
  };
}

export async function runCommandBinary(file: string, args: readonly string[] = [], options: RunCommandOptions = {}): Promise<BinaryCommandResult> {
  const command = [file, ...args].join(" ");
  const result = await trackSubprocess(execa(file, [...args], {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    reject: options.reject ?? false,
    encoding: "buffer"
  }));
  const stderr = toBuffer(result.stderr).toString("utf8");

  return {
    command,
    exitCode: result.exitCode ?? 0,
    stdout: toBuffer(result.stdout),
    stderr,
    outputLines: splitLines(stderr).slice(-DEFAULT_MAX_OUTPUT_LINES)
  };
}

export function trackedProcessCount(): number {
  return trackedProcesses.size;
}

export function stopTrackedProcesses(signal: NodeJS.Signals = "SIGTERM"): number {
  let stopped = 0;

  for (const subprocess of trackedProcesses.keys()) {
    if (stopSubprocess(subprocess, signal)) {
      stopped += 1;
    }
  }

  return stopped;
}

export async function waitForTrackedProcesses(timeoutMs = 1000): Promise<void> {
  const pending = [...trackedProcesses.values()];
  if (pending.length === 0) {
    return;
  }

  await Promise.race([
    Promise.allSettled(pending),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs).unref();
    })
  ]);
}

export function registerProcessCleanupHandlers(): () => void {
  if (cleanupHandlersRegistered) {
    return () => undefined;
  }

  cleanupHandlersRegistered = true;
  const cleanup = (): void => {
    stopTrackedProcesses();
  };
  const signalCleanup = (signal: NodeJS.Signals): void => {
    stopTrackedProcesses(signal);
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    setTimeout(() => process.exit(process.exitCode ?? 1), 100).unref();
  };
  const onSigint = (): void => signalCleanup("SIGINT");
  const onSigterm = (): void => signalCleanup("SIGTERM");

  process.once("SIGINT", onSigint);
  process.once("SIGTERM", onSigterm);
  process.once("exit", cleanup);

  return () => {
    cleanupHandlersRegistered = false;
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    process.off("exit", cleanup);
  };
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).filter((line) => line.length > 0);
}

function pushBounded(lines: string[], line: string, maxLines = Number.POSITIVE_INFINITY): void {
  lines.push(line);
  if (lines.length > maxLines) {
    lines.splice(0, lines.length - maxLines);
  }
}

function trackSubprocess<T extends TrackableSubprocess>(subprocess: T): T {
  const done = Promise.resolve(subprocess).finally(() => {
    trackedProcesses.delete(subprocess);
  });
  trackedProcesses.set(subprocess, done);
  done.catch(() => undefined);
  return subprocess;
}

function stopSubprocess(subprocess: TrackableSubprocess, signal: NodeJS.Signals = "SIGTERM"): boolean {
  if (subprocess.killed) {
    return false;
  }

  try {
    return subprocess.kill(signal);
  } catch {
    return false;
  }
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
