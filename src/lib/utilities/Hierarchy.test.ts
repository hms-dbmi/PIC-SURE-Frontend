import { describe, it, expect } from 'vitest';
import { conceptDepth, sortHierarchyDeepestFirst } from './Hierarchy';
import type { SearchResult } from '$lib/models/Search';

/** Helper to create a minimal SearchResult with just the fields relevant to hierarchy sorting. */
function makeResult(conceptPath: string): SearchResult {
  return {
    conceptPath,
    dataset: 'Test',
    name: conceptPath.split('\\').filter(Boolean).pop() || '',
    display: conceptPath.split('\\').filter(Boolean).pop() || '',
    studyAcronym: '',
    description: '',
    type: 'Categorical',
    allowFiltering: false,
  };
}

describe('conceptDepth', () => {
  it('counts segments in a backslash-delimited path', () => {
    expect(conceptDepth('\\Synthea\\')).toBe(1);
    expect(conceptDepth('\\Synthea\\ACT Diagnosis ICD-10\\')).toBe(2);
    expect(conceptDepth('\\Synthea\\ACT Diagnosis ICD-10\\K00-K95\\')).toBe(3);
    expect(conceptDepth('\\Synthea\\ACT\\K00\\K20\\')).toBe(4);
  });

  it('handles paths without trailing backslash', () => {
    expect(conceptDepth('\\Synthea')).toBe(1);
    expect(conceptDepth('\\Synthea\\ACT')).toBe(2);
  });

  it('handles empty string', () => {
    expect(conceptDepth('')).toBe(0);
  });
});

describe('sortHierarchyDeepestFirst', () => {
  const root = makeResult('\\Synthea\\');
  const mid = makeResult('\\Synthea\\ACT Diagnosis ICD-10\\');
  const midDeep = makeResult(
    '\\Synthea\\ACT Diagnosis ICD-10\\K00-K95 Diseases of the digestive system\\',
  );
  const leaf = makeResult(
    '\\Synthea\\ACT Diagnosis ICD-10\\K00-K95 Diseases of the digestive system\\K20-K31 Diseases of esophagus\\',
  );

  it('sorts root-to-leaf input into deepest-first order', () => {
    const rootToLeaf = [root, mid, midDeep, leaf];
    const sorted = sortHierarchyDeepestFirst(rootToLeaf);

    expect(sorted.map((r) => r.conceptPath)).toEqual([
      leaf.conceptPath,
      midDeep.conceptPath,
      mid.conceptPath,
      root.conceptPath,
    ]);
  });

  it('preserves already-correct deepest-first order', () => {
    const leafToRoot = [leaf, midDeep, mid, root];
    const sorted = sortHierarchyDeepestFirst(leafToRoot);

    expect(sorted.map((r) => r.conceptPath)).toEqual([
      leaf.conceptPath,
      midDeep.conceptPath,
      mid.conceptPath,
      root.conceptPath,
    ]);
  });

  it('handles arbitrary/shuffled order', () => {
    const shuffled = [mid, leaf, root, midDeep];
    const sorted = sortHierarchyDeepestFirst(shuffled);

    expect(sorted.map((r) => r.conceptPath)).toEqual([
      leaf.conceptPath,
      midDeep.conceptPath,
      mid.conceptPath,
      root.conceptPath,
    ]);
  });

  it('does not mutate the original array', () => {
    const original = [root, mid, leaf];
    const originalCopy = [...original];
    sortHierarchyDeepestFirst(original);

    expect(original).toEqual(originalCopy);
  });

  it('handles single-element array', () => {
    const single = [leaf];
    const sorted = sortHierarchyDeepestFirst(single);
    expect(sorted).toEqual([leaf]);
  });

  it('handles empty array', () => {
    const sorted = sortHierarchyDeepestFirst([]);
    expect(sorted).toEqual([]);
  });
});
