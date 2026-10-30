// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

const { getHierarchyConcepts, getConceptTree, toastError } = vi.hoisted(() => ({
  getHierarchyConcepts: vi.fn(),
  getConceptTree: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$lib/stores/Dictionary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/Dictionary')>()),
  getHierarchyConcepts,
  getConceptTree,
}));
vi.mock('$lib/toaster', () => ({ toaster: { error: toastError } }));

import type { SearchResult } from '$lib/models/Search';
import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';
import { rejection } from './helpers';

const data = { dataset: 'phs000001', conceptPath: '\\phs000001\\age\\' } as SearchResult;

describe('HierarchyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    getHierarchyConcepts.mockRejectedValue(rejection(429, message));
    render(HierarchyComponent, { data });

    expect(await screen.findByText(message, { selector: 'p' })).toBeInTheDocument();
    expect(screen.queryByText('Error loading hierarchy')).toBeNull();
  });

  it('keeps the generic error for other failures', async () => {
    getHierarchyConcepts.mockRejectedValue(rejection(500, 'Internal Server Error'));
    render(HierarchyComponent, { data });

    expect(await screen.findByText('Error loading hierarchy')).toBeInTheDocument();
  });

  describe('adding the selection', () => {
    const generic =
      'Something went wrong when adding the filter. If the problem persists, please contact your administrator.';

    async function addSelectionRejectedWith(e: unknown) {
      getHierarchyConcepts.mockResolvedValue([
        { ...data, display: 'Age', name: 'age', conceptPath: data.conceptPath },
      ]);
      getConceptTree.mockRejectedValue(e);
      render(HierarchyComponent, { data });
      await screen.findByText('Age (age)');
      await fireEvent.click(screen.getByTestId('add-filter'));
      await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1));
      return toastError.mock.calls[0][0];
    }

    it("toasts a 429's message instead of the generic error", async () => {
      const message = "You've made too many requests. Try again in 30 seconds.";

      expect(await addSelectionRejectedWith(rejection(429, message))).toEqual({
        description: message,
      });
    });

    it('keeps the generic toast for other failures', async () => {
      expect(await addSelectionRejectedWith(rejection(500, 'Internal Server Error'))).toEqual({
        description: generic,
      });
    });
  });
});
