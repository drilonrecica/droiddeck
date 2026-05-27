import type { DroidDeckConfig } from "../types/config.js";
import type { AndroidVariant } from "../types/variant.js";
import { DroidDeckError } from "../utils/errors.js";

export function resolveApplicationId(config: DroidDeckConfig, variant: AndroidVariant): string {
  const appId = config.applicationIds[variant.name] || variant.applicationId;
  if (appId) {
    return appId;
  }

  throw new DroidDeckError(
    `Could not determine applicationId for variant "${variant.name}".`,
    `Add this to droiddeck.config.json:\n\n{\n  "applicationIds": {\n    "${variant.name}": "your.package.name"\n  }\n}`
  );
}
