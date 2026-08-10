import type { PatientCount } from '$lib/models/Stat';
import { countResult, isObfuscatedBelowThreshold } from '$lib/services/counts/countFormat';
import type { CountValue } from '$lib/services/counts/providers';

export interface ResultCountSummary {
  total: PatientCount;
  hasNonZero: boolean;
  hasError: boolean;
}

export interface ResultCountSnapshot {
  descriptorKey: string;
  count: CountValue;
  summary: ResultCountSummary;
}

function isNonZeroCell(value: CountValue): boolean {
  // Obfuscated "< N" counts represent non-zero values that were privacy-suppressed.
  // Treating them as zero would silently flip the panel's "has results" gate.
  if (isObfuscatedBelowThreshold(value)) return true;
  return `${countResult([value])}` !== '0';
}

export function summarize(count: CountValue, hasError: boolean): ResultCountSummary {
  return {
    total: countResult([count], false),
    hasNonZero: isNonZeroCell(count),
    hasError,
  };
}
