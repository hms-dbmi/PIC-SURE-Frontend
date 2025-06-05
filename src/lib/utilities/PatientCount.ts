import type { PatientCount, CountMap } from '$lib/types';

const PLUS_MINUS = '\u00B1';

function parseEntry(entry: PatientCount): { value: number; suffix: number } {
  const [rawValue, rawSuffix] = String(entry).split(PLUS_MINUS);
  const value = parseInt(rawValue.replace(',', '')) || 0;
  const suffix = parseInt(rawSuffix ?? '') || 0;
  return { value, suffix };
}

function normalizeEntries(input: CountMap | (PatientCount | undefined)[]): PatientCount[] {
  const values = Array.isArray(input) ? input : Object.values(input);
  return values.filter((x): x is PatientCount => x !== undefined);
}

export function countResult(
  result: CountMap | (PatientCount | undefined)[],
  asString = true,
): PatientCount {
  const entries = normalizeEntries(result);
  if (entries.length === 0) return asString ? '0' : 0;
  if (entries.length === 1) return entries[0];

  const parsed = entries.map(parseEntry);
  const total = parsed.reduce((sum, { value }) => sum + value, 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);

  if (!asString) return total;

  return maxSuffix > 0
    ? `${total.toLocaleString()} ${PLUS_MINUS}${maxSuffix}`
    : total.toLocaleString();
}
