// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { post, toastError } = vi.hoisted(() => ({ post: vi.fn(), toastError: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/api')>()),
  post,
}));
vi.mock('$lib/toaster', () => ({ toaster: { error: toastError } }));
vi.mock('$lib/utilities/QueryBuilder', () => ({ getQueryRequestV3: () => ({ query: {} }) }));
vi.mock('$lib/AccessState', () => ({ isOpenAccess: () => true, useOpenAccess: () => true }));
vi.mock('plotly.js-basic-dist-min', () => ({ newPlot: vi.fn() }));

import Visualizations from '$lib/components/explorer/Visualizations.svelte';

function rejection(status: 429 | 500, message: string): unknown {
  try {
    error(status, message);
  } catch (e) {
    return e;
  }
}

describe('Visualizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    post.mockRejectedValue(rejection(429, message));
    render(Visualizations);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith({ description: message }));
  });

  it('keeps the generic error for other failures', async () => {
    post.mockRejectedValue(rejection(500, 'Internal Server Error'));
    render(Visualizations);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith({
        description: expect.stringContaining(
          'An error occured while loading your visualization(s).',
        ),
      }),
    );
  });
});
