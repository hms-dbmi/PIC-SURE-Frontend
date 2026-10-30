// Shape checks for responses at the API boundary: a response a caller can't use fails here, with
// the resource named, instead of surfacing as a property read on undefined deep in a component.

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function expectArray(value: unknown, what: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${what} response`);
  return value;
}

export function expectRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Invalid ${what} response`);
  return value;
}
