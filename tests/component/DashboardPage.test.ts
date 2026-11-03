// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

const { loadDashboardData } = vi.hoisted(() => ({ loadDashboardData: vi.fn() }));

vi.mock('$app/environment', () => ({ browser: true }));
vi.mock('$lib/stores/Dashboard', async () => {
  const { writable } = await import('svelte/store');
  return {
    loadDashboardData,
    columns: writable([]),
    rows: writable([]),
    activeRow: writable({}),
  };
});

import DashboardPage from '../../src/routes/(picsure)/(public)/dashboard/+page.svelte';
import { rejection } from './helpers';

describe('Dashboard page', () => {
  it("shows a 429's message instead of the generic error", async () => {
    const message = "You've made too many requests. Try again in 30 seconds.";
    loadDashboardData.mockRejectedValue(rejection(429, message));
    render(DashboardPage);

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByText('An Error Occured')).toBeNull();
  });

  it('keeps the generic error for other failures', async () => {
    loadDashboardData.mockRejectedValue(rejection(500, 'Internal Server Error'));
    render(DashboardPage);

    expect(await screen.findByText('An Error Occured')).toBeInTheDocument();
  });
});
