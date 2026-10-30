// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { error } from '@sveltejs/kit';

const { getDatasetDetails } = vi.hoisted(() => ({ getDatasetDetails: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/Dictionary', () => ({ getDatasetDetails }));
vi.mock('$lib/stores/Dashboard', async () => {
  const { writable } = await import('svelte/store');
  return { activeRow: writable({ dataset_id: 'phs000001', name: 'Study One' }) };
});

import DashboardDrawer from '$lib/components/dashboard/DashboardDrawer.svelte';

function rejection(status: 429 | 500, message: string): unknown {
  try {
    error(status, message);
  } catch (e) {
    return e;
  }
}

describe('DashboardDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    getDatasetDetails.mockRejectedValue(rejection(429, message));
    render(DashboardDrawer);

    expect(await screen.findByRole('heading', { name: message })).toBeInTheDocument();
    expect(screen.queryByText('An Error Occured')).toBeNull();
  });

  it('keeps the generic error for other failures', async () => {
    getDatasetDetails.mockRejectedValue(rejection(500, 'Internal Server Error'));
    render(DashboardDrawer);

    expect(await screen.findByRole('heading', { name: 'An Error Occured' })).toBeInTheDocument();
  });
});
