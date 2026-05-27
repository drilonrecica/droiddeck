export type LogMode = "errors" | "warnings" | "all";

export type LaunchMode = "monkey" | "activity";

export type DroidDeckConfig = {
  projectName?: string;
  appModule: string;
  variantAliases: Record<string, string>;
  applicationIds: Record<string, string>;
  mainActivity?: string;
  logcat: {
    defaultMode: LogMode;
    tags: string[];
  };
  actions: {
    launchMode: LaunchMode;
  };
};

