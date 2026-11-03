// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import {
  createFilterGroup,
  type FilterGroupInterface,
  type FilterInterface,
} from '#lib/query/filter.svelte.ts';
import { LogicTree } from '#lib/query/logicTree.svelte.ts';
import { Operator } from '#lib/query/query.ts';
import FilterTreeViewHarness from '../../../../tests/support/fixtures/FilterTreeViewHarness.svelte';

const filter = (name: string) =>
  ({ uuid: name, variableName: name, filterType: 'Categorical' }) as unknown as FilterInterface;

describe('FilterTreeView', () => {
  it('renders filters and nested subqueries in order, joined by their own operators', () => {
    const tree = new LogicTree<FilterInterface>(createFilterGroup);
    const inner = createFilterGroup([filter('c'), filter('d')], Operator.AND);
    const outer = createFilterGroup([filter('b'), inner], Operator.OR);
    tree.add(filter('a'), outer, filter('e'));

    render(FilterTreeViewHarness, { group: tree.root as FilterGroupInterface });

    expect(screen.getByTestId('tree').textContent?.replace(/\s/g, '')).toBe(
      'a|AND|[b|OR|[c|AND|d]]|AND|e',
    );
  });
});
