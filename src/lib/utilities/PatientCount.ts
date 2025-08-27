import type { PatientCount, StatValue } from '$lib/models/Stat';
import { features } from '$lib/configuration';

const PLUS_MINUS = '\u00B1';

function parseCount(count: PatientCount): { value: number; suffix: number } {
  let value: number;
  let suffix: number;
  if (String(count).startsWith('<')) {
    suffix = 3;
    value = 0;
  } else {
    const [rawValue, rawSuffix] = String(count).split(PLUS_MINUS);
    value = parseInt(rawValue.replaceAll(',', '')) || 0;
    suffix = parseInt(rawSuffix ?? '') || 0;
  }
  return { value, suffix };
}

function normalizeCounts(countInput: StatValue[]): PatientCount[] {
  return countInput.flatMap((x: StatValue) => (typeof x === 'object' ? Object.values(x) : x));
}

export function countResult(results: StatValue[], asString = true): PatientCount {
  const counts = normalizeCounts(results);
  if (counts.length === 0) return !features.federated ? undefined : asString ? '0' : 0;
  if (counts.length === 1 && counts[0]?.toString().startsWith('<')) return counts[0];

  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => (value > 0 ? sum + value : sum), 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);

  if (!asString) return total;

  return maxSuffix > 0
    ? `${total.toLocaleString()}${PLUS_MINUS}${maxSuffix}`
    : total.toLocaleString();
}
