export type CommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  outputLines: string[];
};

