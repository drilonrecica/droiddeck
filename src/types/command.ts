export type CommandStatus = "idle" | "running" | "success" | "failed" | "cancelled";

export type CommandState = {
  title: string;
  status: CommandStatus;
  outputLines: string[];
  error?: string;
  startedAt?: number;
  endedAt?: number;
};

export type CommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  outputLines: string[];
};

export type BinaryCommandResult = {
  command: string;
  exitCode: number;
  stdout: Buffer;
  stderr: string;
  outputLines: string[];
};
