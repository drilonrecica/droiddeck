import type { LogMode } from "./config.js";

export type LogPriority = "V" | "D" | "I" | "W" | "E" | "F";

export type LogLine = {
  timestamp?: string;
  priority?: LogPriority;
  pid?: string;
  tid?: string;
  tag?: string;
  message: string;
  raw: string;
};

export type LogState = {
  mode: LogMode;
  isRunning: boolean;
  lines: LogLine[];
  visibleLines: LogLine[];
  processPid?: number;
};
