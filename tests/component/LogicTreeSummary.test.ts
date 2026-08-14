// @vitest-environment happy-dom

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import LogicTreeSummary from '$lib/components/explorer/advanced/LogicTreeSummary.svelte';
import { createFilterGroup, type FilterInterface } from '$lib/models/Filter.svelte';
import { Operator } from '$lib/models/query/Query';

function makeFilter(variableName: string): FilterInterface {
  return {
    parent: undefined,
    uuid: `filter-${variableName}`,
    id: `\\test\\${variableName}\\`,
    filterType: 'Categorical',
    displayType: 'restrict',
    variableName,
    allowFiltering: true,
    dataset: '',
  };
}

describe('LogicTreeSummary', () => {
  it('renders spaces around boolean operators', () => {
    const root = createFilterGroup([makeFilter('varA'), makeFilter('varB')], Operator.AND);

    render(LogicTreeSummary, { root });

    expect(screen.getByTestId('logic-tree-text').textContent).toBe('varA AND varB');
  });

  it('renders spaces around operators in nested groups', () => {
    const nested = createFilterGroup([makeFilter('varB'), makeFilter('varC')], Operator.AND);
    const root = createFilterGroup([makeFilter('varA'), nested], Operator.OR);

    render(LogicTreeSummary, { root });

    expect(screen.getByTestId('logic-tree-text').textContent).toBe('varA OR (varB AND varC)');
  });

  it('separates operators with breaking spaces so long summaries can wrap', () => {
    const root = createFilterGroup([makeFilter('varA'), makeFilter('varB')], Operator.AND);

    render(LogicTreeSummary, { root });

    const text = screen.getByTestId('logic-tree-text').textContent ?? '';
    // A non-breaking space would render correctly but glue the operator to its
    // neighbours, so assert the separators are ordinary breaking spaces.
    expect(text).not.toContain('\u00a0');
    expect(text.split(' ')).toEqual(['varA', 'AND', 'varB']);
  });
});
