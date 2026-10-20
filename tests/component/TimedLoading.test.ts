// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import TimedLoading from '$lib/components/TimedLoading.svelte';

const messages = [
  { afterMs: 0, text: 'Generating visualizations…' },
  { afterMs: 3000, text: 'Still working on it…' },
  { afterMs: 7000, text: 'Hang tight…' },
];

function advance(ms: number) {
  vi.advanceTimersByTime(ms);
  flushSync();
}

describe('TimedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows each message once its time has passed', () => {
    render(TimedLoading, { messages, size: 'medium' });
    expect(screen.getByRole('status')).toHaveTextContent('Generating visualizations…');

    advance(2999);
    expect(screen.getByRole('status')).toHaveTextContent('Generating visualizations…');

    advance(1);
    expect(screen.getByRole('status')).toHaveTextContent('Still working on it…');

    advance(4000);
    expect(screen.getByRole('status')).toHaveTextContent('Hang tight…');

    advance(60_000);
    expect(screen.getByRole('status')).toHaveTextContent('Hang tight…');
  });

  it('restarts the schedule when the messages change', async () => {
    const { rerender } = render(TimedLoading, { messages, size: 'micro' });
    advance(5000);
    expect(screen.getByRole('status')).toHaveTextContent('Still working on it…');

    await rerender({ messages: [{ afterMs: 0, text: 'Retrying…' }] });
    expect(screen.getByRole('status')).toHaveTextContent('Retrying…');

    advance(10_000);
    expect(screen.getByRole('status')).toHaveTextContent('Retrying…');
  });

  it('clears its timers when unmounted', () => {
    const { unmount } = render(TimedLoading, { messages });
    expect(vi.getTimerCount()).toBe(2);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
