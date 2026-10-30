import type { FieldType } from '#lib/config/schema.ts';

/** Why `value` can't be saved as a `type` field, or `''` when it can. */
export function configValueError(type: FieldType, value: string): string {
  if (type === 'int') return /^-?\d+$/.test(value.trim()) ? '' : 'Must be an integer.';
  if (type !== 'json') return '';
  try {
    JSON.parse(value);
    return '';
  } catch (e) {
    return e instanceof Error ? e.message : 'Invalid JSON';
  }
}

/** The stored form of a valid value: integers and JSON normalised. */
export function serializeConfigValue(type: FieldType, value: string): string {
  if (type === 'int') return String(parseInt(value.trim(), 10));
  if (type === 'json') return JSON.stringify(JSON.parse(value));
  return value;
}

/** Indented JSON, or `value` unchanged when it doesn't parse. */
export function prettifyJson(value: string): string {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
