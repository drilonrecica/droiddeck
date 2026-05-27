import { useState } from "react";
import type { LogLine } from "../../types/log.js";

export function useLogcat() {
  const [lines, setLines] = useState<LogLine[]>([]);
  return {
    lines,
    clear: () => setLines([]),
    append: (line: LogLine) => setLines((current) => [...current, line].slice(-500))
  };
}
