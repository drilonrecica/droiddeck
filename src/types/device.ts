export type AndroidDevice = {
  id: string;
  state: "device" | "offline" | "unauthorized" | "unknown";
  model?: string;
  androidVersion?: string;
  apiLevel?: string;
  isEmulator: boolean;
  rawLine: string;
};
