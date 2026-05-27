export type CommandStatus = "idle" | "running" | "success" | "failed";

export type CommandState = {
  status: CommandStatus;
  command?: string;
  startedAt?: number;
  endedAt?: number;
  exitCode?: number;
  outputLines: string[];
  error?: string;
};
