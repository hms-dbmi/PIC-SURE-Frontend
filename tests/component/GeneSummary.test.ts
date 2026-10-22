// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import Summary from '$lib/components/explorer/genome-filter/gene/Summary.svelte';

describe('Gene filter Summary', () => {
  it('labels each column of the selected filters', () => {
    render(Summary);

    expect(screen.getByText('Genomic Region:')).toBeInTheDocument();
    expect(screen.getByText('Calculated Consequence:')).toBeInTheDocument();
    expect(screen.getByText('Variant Frequency:')).toBeInTheDocument();
  });
});
