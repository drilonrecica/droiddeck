import {
  loadProjectSession,
  resolveSessionApplicationId,
  resolveSessionDevice,
  resolveSessionVariant,
  type ProjectSession
} from "../core/session.js";
import type { AndroidDevice } from "../types/device.js";
import type { AndroidVariant } from "../types/variant.js";

export type CommandContext = ProjectSession;

export async function loadCommandContext(): Promise<CommandContext> {
  return loadProjectSession();
}

export function resolveContextVariant(context: CommandContext, variantOrAlias?: string): AndroidVariant {
  return resolveSessionVariant(context, variantOrAlias);
}

export async function resolveContextDevice(context: CommandContext, deviceId?: string): Promise<AndroidDevice> {
  return resolveSessionDevice(context, deviceId);
}

export async function resolveContextApplicationId(context: CommandContext, variant: AndroidVariant): Promise<string> {
  return resolveSessionApplicationId(context, variant);
}
