import { describe, it, expect } from 'vitest';

import { Operator } from '$lib/models/query/Query';
import { createFilterGroup, type FilterInterface } from '$lib/models/Filter.svelte';
import {
  buildEquation,
  type EquationPart,
} from '$lib/components/explorer/advanced/logicTreeSummary';

function createFilter(name: string): FilterInterface {
  return {
    uuid: name,
    id: name,
    variableName: name,
    filterType: 'Categorical',
    displayType: 'restrict',
    allowFiltering: true,
    dataset: 'test',
    parent: undefined,
  } as FilterInterface;
}

describe('buildEquation', () => {
  it('empty tree — root with no children returns []', () => {
    // Given
    const root = createFilterGroup([], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    expect(result).toEqual([]);
  });

  it('single filter — root with one child A', () => {
    // Given
    const A = createFilter('A');
    const root = createFilterGroup([A], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [{ type: 'variable', text: 'A' }];
    expect(result).toEqual(expected);
  });

  it('two filters AND — root(AND) with [A, B]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const root = createFilterGroup([A, B], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'B' },
    ];
    expect(result).toEqual(expected);
  });

  it('two filters OR — root(OR) with [A, B]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const root = createFilterGroup([A, B], Operator.OR);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'OR' },
      { type: 'variable', text: 'B' },
    ];
    expect(result).toEqual(expected);
  });

  it('three filters — root(AND) with [A, B, C]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const C = createFilter('C');
    const root = createFilterGroup([A, B, C], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'B' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'C' },
    ];
    expect(result).toEqual(expected);
  });

  it('nested subquery — root(AND) with [A, group(OR)->[B, C]]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const C = createFilter('C');
    const subquery = createFilterGroup([B, C], Operator.OR);
    const root = createFilterGroup([A, subquery], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'paren', text: '(' },
      { type: 'variable', text: 'B' },
      { type: 'operator', text: 'OR' },
      { type: 'variable', text: 'C' },
      { type: 'paren', text: ')' },
    ];
    expect(result).toEqual(expected);
  });

  it('deeply nested — root(AND) with [A, group(OR)->[B, group(AND)->[C, D]]]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const C = createFilter('C');
    const D = createFilter('D');
    const inner = createFilterGroup([C, D], Operator.AND);
    const subquery = createFilterGroup([B, inner], Operator.OR);
    const root = createFilterGroup([A, subquery], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    // Expected: A AND (B OR (C AND D))
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'paren', text: '(' },
      { type: 'variable', text: 'B' },
      { type: 'operator', text: 'OR' },
      { type: 'paren', text: '(' },
      { type: 'variable', text: 'C' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'D' },
      { type: 'paren', text: ')' },
      { type: 'paren', text: ')' },
    ];
    expect(result).toEqual(expected);
  });

  it('empty group skipped — root(AND) with [A, emptyGroup, B]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const emptyGroup = createFilterGroup([], Operator.OR);
    const root = createFilterGroup([A, emptyGroup as unknown as FilterInterface, B], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'B' },
    ];
    expect(result).toEqual(expected);
  });

  it('single subquery at root unwrapped — root(AND) with [group(OR)->[A, B]]', () => {
    // Given
    const A = createFilter('A');
    const B = createFilter('B');
    const subquery = createFilterGroup([A, B], Operator.OR);
    const root = createFilterGroup([subquery], Operator.AND);

    // When
    const result = buildEquation(root);

    // Then
    // No parens — the single subgroup at root is unwrapped
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'OR' },
      { type: 'variable', text: 'B' },
    ];
    expect(result).toEqual(expected);
  });

  it('genomic filters appended — root(AND)->[A] + genomic:[G]', () => {
    // Given
    const A = createFilter('A');
    const G = createFilter('G');
    const root = createFilterGroup([A], Operator.AND);

    // When
    const result = buildEquation(root, [G]);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'G' },
    ];
    expect(result).toEqual(expected);
  });

  it('only genomic — empty root + genomic:[G]', () => {
    // Given
    const G = createFilter('G');
    const root = createFilterGroup([], Operator.AND);

    // When
    const result = buildEquation(root, [G]);

    // Then
    const expected: EquationPart[] = [{ type: 'variable', text: 'G' }];
    expect(result).toEqual(expected);
  });

  it('multiple genomic — root(AND)->[A] + genomic:[G1, G2]', () => {
    // Given
    const A = createFilter('A');
    const G1 = createFilter('G1');
    const G2 = createFilter('G2');
    const root = createFilterGroup([A], Operator.AND);

    // When
    const result = buildEquation(root, [G1, G2]);

    // Then
    const expected: EquationPart[] = [
      { type: 'variable', text: 'A' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'G1' },
      { type: 'operator', text: 'AND' },
      { type: 'variable', text: 'G2' },
    ];
    expect(result).toEqual(expected);
  });
});
