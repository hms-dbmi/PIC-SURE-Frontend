import type { PatientCount, CountMap } from '$lib/types';

const PLUS_MINUS = '\u00B1';

function parseCount(count: PatientCount): { value: number; suffix: number } {
  const [rawValue, rawSuffix] = String(count).split(PLUS_MINUS);
  const value = parseInt(rawValue.replace(',', '')) || 0;
  const suffix = parseInt(rawSuffix ?? '') || 0;
  return { value, suffix };
}

function normalizeCounts(countInput: CountMap | (PatientCount | undefined)[]): PatientCount[] {
  const counts = Array.isArray(countInput) ? countInput : Object.values(countInput);
  return counts.filter((x): x is PatientCount => x !== undefined);
}

export function countResult(
  results: CountMap | (PatientCount | undefined)[],
  asString = true,
): PatientCount {
  const counts = normalizeCounts(results);
  if (counts.length === 0) return asString ? '0' : 0;
  if (counts.length === 1) return counts[0];

  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => (value > 0 ? sum + value : sum), 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);

  if (!asString) return total;

  return maxSuffix > 0
    ? `${total.toLocaleString()} ${PLUS_MINUS}${maxSuffix}`
    : total.toLocaleString();
}
