import { useEffect, useMemo, useRef, useState } from "react";
import { appendBoundedLogLine, isCrashLine, streamLogcat } from "../../core/logcat.js";
import type { LogMode } from "../../types/config.js";
import type { LogLine } from "../../types/log.js";

export type UseLogcatOptions = {
  enabled: boolean;
  deviceId?: string;
  applicationId?: string;
  mode: LogMode;
  tags: readonly string[];
};

export type UseLogcatResult = {
  lines: LogLine[];
  status: "idle" | "starting" | "streaming" | "failed";
  warning?: string;
  error?: string;
  clear: () => void;
};

export function useLogcat(options: UseLogcatOptions): UseLogcatResult {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [status, setStatus] = useState<UseLogcatResult["status"]>("idle");
  const [warning, setWarning] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const tagKey = useMemo(() => options.tags.join("\0"), [options.tags]);
  const streamStopRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!options.enabled || !options.deviceId) {
      streamStopRef.current?.();
      streamStopRef.current = undefined;
      setStatus("idle");
      return;
    }

    let active = true;
    setStatus("starting");
    setWarning(undefined);
    setError(undefined);

    streamLogcat({
      deviceId: options.deviceId,
      applicationId: options.applicationId,
      mode: options.mode,
      tags: options.tags,
      onWarning: (message) => {
        if (active) {
          setWarning(message);
        }
      },
      onLine: (line) => {
        if (!active) {
          return;
        }
        const nextLine = {
          ...line,
          isCrash: isCrashLine(line)
        };
        setLines((current) => appendBoundedLogLine(current, nextLine, 500));
      }
    })
      .then((stream) => {
        if (!active) {
          stream.stop();
          return;
        }

        streamStopRef.current = stream.stop;
        setStatus("streaming");
        stream.done.then((result) => {
          if (active && result.exitCode !== 0 && result.exitCode !== 143) {
            setStatus("failed");
            setError(result.outputLines.slice(-10).join("\n") || `Logcat exited with ${result.exitCode}.`);
          }
        });
      })
      .catch((caught) => {
        if (active) {
          setStatus("failed");
          setError(caught instanceof Error ? caught.message : String(caught));
        }
      });

    return () => {
      active = false;
      streamStopRef.current?.();
      streamStopRef.current = undefined;
    };
  }, [options.enabled, options.deviceId, options.applicationId, options.mode, tagKey]);

  return {
    lines,
    status,
    warning,
    error,
    clear: () => setLines([])
  };
}
