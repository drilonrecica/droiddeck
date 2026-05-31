import type { KeyEvent } from "@opentui/core";
import { useKeyboard } from "@opentui/react";

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
  useKeyboard((key) => {
    if (!enabled || key.eventType !== "press") {
      return;
    }

    if (isKey(key, "r") && !key.shift) {
      actions.onRun();
    } else if (isKey(key, "R") || (isKey(key, "r") && key.shift)) {
      actions.onCleanRun();
    } else if (isKey(key, "v")) {
      actions.onSelectVariant();
    } else if (isKey(key, "d") && !key.shift) {
      actions.onSelectDevice();
    } else if (isKey(key, "c") && !key.shift) {
      actions.onClear();
    } else if (isKey(key, "l")) {
      actions.onLaunch();
    } else if (isKey(key, "K") || (isKey(key, "k") && key.shift)) {
      actions.onKill();
    } else if (isKey(key, "u")) {
      actions.onUninstall();
    } else if (isKey(key, "t")) {
      actions.onTest();
    } else if (isKey(key, "s")) {
      actions.onScreenshot();
    } else if (isKey(key, "g")) {
      actions.onLogs();
    } else if (isKey(key, "D") || (isKey(key, "d") && key.shift)) {
      actions.onDoctor();
    } else if (isKey(key, "?")) {
      actions.onHelp();
    } else if (isKey(key, "o")) {
      actions.onOpenReport();
    } else if (isKey(key, "C") || (isKey(key, "c") && key.shift)) {
      actions.onClearVisibleLogs();
    } else if (isKey(key, "q")) {
      actions.onQuit();
    } else {
      return;
    }

    key.preventDefault();
  });
}

function isKey(key: KeyEvent, value: string): boolean {
  return key.name === value || key.raw === value || key.sequence === value;
}
