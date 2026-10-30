// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { getHierarchyConcepts } = vi.hoisted(() => ({ getHierarchyConcepts: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));
vi.mock('$lib/stores/Dictionary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/stores/Dictionary')>()),
  getHierarchyConcepts,
}));

import type { SearchResult } from '$lib/models/Search';
import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';

const data = { dataset: 'phs000001', conceptPath: '\\phs000001\\age\\' } as SearchResult;

function rejection(status: 429 | 500, message: string): unknown {
  try {
    error(status, message);
  } catch (e) {
    return e;
  }
}

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
});
