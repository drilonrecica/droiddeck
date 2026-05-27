import { useInput } from "ink";

export function useKeyboardActions(bindings: Record<string, () => void>): void {
  useInput((input) => {
    bindings[input]?.();
  });
}
