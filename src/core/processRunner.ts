import { execa, type Options } from "execa";

export type RunCommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  outputLines: string[];
};

export type RunCommandOptions = {
  cwd?: string;
  reject?: boolean;
  env?: NodeJS.ProcessEnv;
  onLine?: (line: string) => void;
  input?: string;
};

export async function runCommand(
  file: string,
  args: string[],
  options: RunCommandOptions = {}
): Promise<RunCommandResult> {
  const command = [file, ...args].join(" ");
  const outputLines: string[] = [];
  const execaOptions: Options = {
    cwd: options.cwd,
    reject: options.reject ?? false,
    env: options.env,
    input: options.input,
    all: true
  };

  const subprocess = execa(file, args, execaOptions);
  subprocess.all?.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      outputLines.push(line);
      options.onLine?.(line);
    }
  });

  const result = await subprocess;
  return {
    command,
    exitCode: result.exitCode ?? 0,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    outputLines
  };
}
