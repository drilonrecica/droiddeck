import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export type VariantBuildTask = {
  task: string;
  installs: boolean;
};

export function selectVariantBuildTask(variant: AndroidVariant): VariantBuildTask {
  if (variant.installTask) {
    return {
      task: variant.installTask,
      installs: true
    };
  }

  if (variant.assembleTask) {
    return {
      task: variant.assembleTask,
      installs: false
    };
  }

  throw new DroidDeckError(`No install or assemble task found for variant "${variant.name}".`);
}

