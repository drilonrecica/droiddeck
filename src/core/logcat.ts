import type { LogMode } from "../types/config.js";
import type { LogLine, LogPriority } from "../types/log.js";
import { adbDeviceArgs, runAdb } from "./adb.js";
import { streamCommand, type StreamingCommand } from "./processRunner.js";

const priorityRank: Record<LogPriority, number> = {
  V: 0,
  D: 1,
  I: 2,
  W: 3,
  E: 4,
  F: 5
};

export type LogFilter = {
  mode: LogMode;
  pid?: string;
  tags?: readonly string[];
};

export type StreamLogcatOptions = LogFilter & {
  deviceId: string;
  applicationId?: string;
  onLine: (line: LogLine) => void;
  onWarning?: (message: string) => void;
  maxOutputLines?: number;
};

export function parseLogLine(raw: string): LogLine {
  const threadtime = /^(\d\d-\d\d\s+\d\d:\d\d:\d\d\.\d+)\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s?(.*)$/.exec(raw);
  if (!threadtime) {
    return { message: raw, raw };
  }

  return {
    timestamp: threadtime[1],
    pid: threadtime[2],
    tid: threadtime[3],
    priority: threadtime[4] as LogPriority,
    tag: threadtime[5]?.trim(),
    message: threadtime[6] ?? "",
    raw
  };
}

export function shouldShowLogLine(line: LogLine, filter: LogFilter): boolean {
  if (filter.pid && line.pid !== filter.pid) {
    return false;
  }

  if (filter.mode === "all") {
    return true;
  }

  if (line.priority && priorityRank[line.priority] >= (filter.mode === "errors" ? priorityRank.E : priorityRank.W)) {
    return true;
  }

  return Boolean(line.tag && filter.tags?.includes(line.tag));
}

export function appendBoundedLogLine(lines: readonly LogLine[], line: LogLine, maxLines = 500): LogLine[] {
  return [...lines, line].slice(-maxLines);
}

export function isCrashLine(line: LogLine): boolean {
  return /FATAL EXCEPTION|AndroidRuntime|java\.lang\.|kotlin\.|Caused by:/i.test(line.raw);
}

export async function findPid(deviceId: string, applicationId: string): Promise<string | undefined> {
  const result = await runAdb([...adbDeviceArgs(deviceId), "shell", "pidof", applicationId]);
  if (result.exitCode !== 0) {
    return undefined;
  }

  return (result.stdout || result.outputLines.join("\n")).trim().split(/\s+/)[0];
}

export async function streamLogcat(options: StreamLogcatOptions): Promise<StreamingCommand> {
  let pid = options.pid;

  if (!pid && options.applicationId) {
    pid = await findPid(options.deviceId, options.applicationId);
    if (!pid) {
      options.onWarning?.(`App process not running for ${options.applicationId}; falling back to priority/tag filtering.`);
    }
  }

  return streamCommand("adb", [...adbDeviceArgs(options.deviceId), "logcat", "-v", "threadtime"], {
    maxOutputLines: options.maxOutputLines ?? 500,
    onLine: (raw) => {
      const line = parseLogLine(raw);
      if (shouldShowLogLine(line, { mode: options.mode, pid, tags: options.tags })) {
        options.onLine(line);
      }
    }
  });
}

export function selectLogMode(options: { errors?: boolean; warnings?: boolean; all?: boolean }, fallback: LogMode): LogMode {
  if (options.errors) {
    return "errors";
  }
  if (options.all) {
    return "all";
  }
  if (options.warnings) {
    return "warnings";
  }
  return fallback;
}
