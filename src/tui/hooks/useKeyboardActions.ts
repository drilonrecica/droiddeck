import { useInput } from "ink";

export type KeyboardActions = {
  onRun: () => void;
  onCleanRun: () => void;
  onSelectVariant: () => void;
  onSelectDevice: () => void;
  onClear: () => void;
  onLaunch: () => void;
  onKill: () => void;
  onUninstall: () => void;
  onTest: () => void;
  onScreenshot: () => void;
  onLogs: () => void;
  onDoctor: () => void;
  onHelp: () => void;
  onOpenReport: () => void;
  onClearVisibleLogs: () => void;
  onQuit: () => void;
};

export function useKeyboardActions(actions: KeyboardActions, enabled = true): void {
  useInput((input) => {
    if (!enabled) {
      return;
    }

    switch (input) {
      case "r":
        actions.onRun();
        break;
      case "R":
        actions.onCleanRun();
        break;
      case "v":
        actions.onSelectVariant();
        break;
      case "d":
        actions.onSelectDevice();
        break;
      case "c":
        actions.onClear();
        break;
      case "l":
        actions.onLaunch();
        break;
      case "k":
        actions.onKill();
        break;
      case "u":
        actions.onUninstall();
        break;
      case "t":
        actions.onTest();
        break;
      case "s":
        actions.onScreenshot();
        break;
      case "g":
        actions.onLogs();
        break;
      case "D":
        actions.onDoctor();
        break;
      case "?":
        actions.onHelp();
        break;
      case "o":
        actions.onOpenReport();
        break;
      case "C":
        actions.onClearVisibleLogs();
        break;
      case "q":
        actions.onQuit();
        break;
    }
  });
}
