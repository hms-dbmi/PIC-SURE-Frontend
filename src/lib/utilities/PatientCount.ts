import type { PatientCount, StatValue } from '$lib/models/Stat';

const PLUS_MINUS = '\u00B1';

function parseEntry(entry: PatientCount): { value: number; suffix: number } {
  let value: number;
  let suffix: number;
  if (String(entry).startsWith('<')) {
    suffix = 3;
    value = 0;
  } else {
    const [rawValue, rawSuffix] = String(entry).split(PLUS_MINUS);
    value = parseInt(rawValue.replace(',', '')) || 0;
    suffix = parseInt(rawSuffix ?? '') || 0;
  }
  return { value, suffix };
}

function normalizeEntries(input: StatValue[]): PatientCount[] {
  return input.flatMap((x: StatValue) => (typeof x === 'object' ? Object.values(x) : x));
}

export function countResult(result: StatValue[], asString = true): PatientCount {
  const entries = normalizeEntries(result);
  if (entries.length === 0) return asString ? '0' : 0;
  if (entries.length === 1 && entries[0].toString().startsWith('<')) return entries[0];

  const parsed = entries.map(parseEntry);
  const total = parsed.reduce((sum, { value }) => (value > 0 ? sum + value : sum), 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);

  if (!asString) return total;

  return maxSuffix > 0
    ? `${total.toLocaleString()} ${PLUS_MINUS}${maxSuffix}`
    : total.toLocaleString();
}
