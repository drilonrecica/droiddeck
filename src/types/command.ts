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
