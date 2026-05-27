export class DroidDeckError extends Error {
  constructor(
    message: string,
    readonly suggestion?: string
  ) {
    super(suggestion ? `${message}\n\n${suggestion}` : message);
    this.name = "DroidDeckError";
  }
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

