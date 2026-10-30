// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

import { facetsPromise } from '$lib/stores/Dictionary';
import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';

function rejection(status: 429 | 500, message: string): Promise<never> {
  try {
    error(status, message);
  } catch (e) {
    const rejected = Promise.reject(e);
    rejected.catch(() => {});
    return rejected;
  }
}

describe('FacetSideBar', () => {
  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    facetsPromise.set(rejection(429, message));
    render(FacetSideBar);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong loading your search options.')).toBeNull();
  });

  it('keeps the generic error for other failures', async () => {
    facetsPromise.set(rejection(500, 'Internal Server Error'));
    render(FacetSideBar);

    expect(
      await screen.findByText('Something went wrong loading your search options.'),
    ).toBeInTheDocument();
  });
});
