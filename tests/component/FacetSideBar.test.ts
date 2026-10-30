// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$app/state', () => ({ page: { url: new URL('http://localhost/explorer') } }));

import { facetsPromise } from '$lib/stores/Dictionary';
import FacetSideBar from '$lib/components/explorer/FacetSideBar.svelte';
import { rejection } from './helpers';

function rejected(status: 429 | 500, message: string): Promise<never> {
  const promise = Promise.reject(rejection(status, message));
  promise.catch(() => {});
  return promise;
}

describe('FacetSideBar', () => {
  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    facetsPromise.set(rejected(429, message));
    render(FacetSideBar);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong loading your search options.')).toBeNull();
    // "wait a moment" would contradict a wait of hours
    expect(screen.queryByText(/Please wait a moment/)).toBeNull();
  });

  it('keeps the generic error for other failures', async () => {
    facetsPromise.set(rejected(500, 'Internal Server Error'));
    render(FacetSideBar);

    expect(
      await screen.findByText('Something went wrong loading your search options.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Please wait a moment/)).toBeInTheDocument();
  });
});
