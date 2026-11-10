// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import Edit from '#lib/explorer/genomic/SNP/Edit.svelte';
import { Genotype } from '#lib/query/genomic.ts';

describe('SNP Edit', () => {
  it('saves the genotype of the SNP it is editing after switching SNPs', async () => {
    const onsave = vi.fn();
    const first = { search: 'chr1,1000,A,G', constraint: Genotype.Heterozygous };
    const second = { search: 'chr2,2000,C,T', constraint: Genotype.Homozygous };
    const { rerender } = render(Edit, { snp: first, onsave });

    await rerender({ snp: second, onsave });
    await fireEvent.click(screen.getByRole('button', { name: 'Save SNP' }));

    expect(onsave).toHaveBeenCalledWith(second);
  });
});
