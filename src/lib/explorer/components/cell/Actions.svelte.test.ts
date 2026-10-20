// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import Actions from '#lib/explorer/components/cell/Actions.svelte';
import { addExport, clearExports, mapSearchResultAsExport } from '#lib/explorer/export/Export.ts';
import type { SearchResult } from '#lib/explorer/types.ts';

vi.mock('#lib/telemetry/logger.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('#lib/telemetry/logger.ts')>()),
  log: vi.fn(),
}));
vi.mock('#lib/explorer/mode.ts', () => ({ isOpenAccess: () => false }));
vi.mock('#lib/config/config.svelte.ts', () => ({
  config: { features: { explorer: { exportsEnableExport: true, enableHierarchy: false } } },
}));

const row = {
  conceptPath: '\\phs1\\age\\',
  name: 'age',
  display: 'Age',
  dataset: 'phs1',
  type: 'Continuous',
  allowFiltering: true,
} as unknown as SearchResult;

describe('search result row actions', () => {
  beforeEach(() => clearExports());

  it('removes an export that was added somewhere else', async () => {
    addExport(mapSearchResultAsExport({ ...row }));
    render(Actions, { row });

    await fireEvent.click(screen.getByRole('button', { name: 'Remove from Analysis (e)' }));

    expect(screen.getByRole('button', { name: 'Add for Analysis (e)' })).toBeVisible();
  });
});
