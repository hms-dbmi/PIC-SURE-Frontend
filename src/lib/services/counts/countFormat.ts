import type { PatientCount, StatValue } from '$lib/models/Stat';

const PLUS_MINUS = '±';

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
  if (counts.length === 0) return asString ? '0' : 0;
  if (counts.length === 1 && counts[0]?.toString().startsWith('<')) return counts[0];

  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => (value > 0 ? sum + value : sum), 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);

  // Privacy-obfuscated `< 10` values must not collapse to a literal "0"
  // when every contributing cell came in below the threshold.
  if (asString && total === 0 && counts.some((c) => c?.toString().trim().startsWith('<')))
    return counts.find((c) => c?.toString().trim().startsWith('<')) as PatientCount;

  if (!asString) return total;

  return maxSuffix > 0
    ? `${total.toLocaleString()}${PLUS_MINUS}${maxSuffix}`
    : total.toLocaleString();
}

export function isCountValueEqual(
  a: StatValue | null | undefined,
  b: StatValue | null | undefined,
): boolean {
  if (a === b) return true;

  const normalize = (val: unknown) => {
    if (typeof val === 'string') return val.replaceAll(',', '');
    return val;
  };

  const normA = normalize(a);
  const normB = normalize(b);

  if (normA == normB) return true;

  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = (a as Record<string, unknown>)[key];
    const valB = (b as Record<string, unknown>)[key];
    if (normalize(valA) != normalize(valB)) return false;
  }
  return true;
}

export function isObfuscatedBelowThreshold(count: unknown): boolean {
  return typeof count === 'string' && count.trim().startsWith('<');
}
