// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

import { Announcer } from '#lib/ui/announcer.svelte.ts';
import LiveRegion from '#lib/ui/LiveRegion.svelte';

describe('Announcer', () => {
  beforeEach(() => void vi.useFakeTimers());
  afterEach(() => void vi.useRealTimers());

  it('debounces: only the last message within the delay is spoken', async () => {
    const announcer = new Announcer({ delay: 250 });

    const first = announcer.announce('first');
    await vi.advanceTimersByTimeAsync(200);
    const second = announcer.announce('second');
    await vi.advanceTimersByTimeAsync(200);
    expect(announcer.message).toBe('');

    await vi.advanceTimersByTimeAsync(50);
    expect(announcer.message).toBe('second');
    await expect(first).resolves.toBe(false);
    await expect(second).resolves.toBe(true);
  });

  it('drops a message identical to the one already spoken', async () => {
    const announcer = new Announcer();
    void announcer.announce('Page 1 of 2');
    await vi.runAllTimersAsync();

    const again = announcer.announce('Page 1 of 2');
    await vi.advanceTimersByTimeAsync(0);

    expect(announcer.message).toBe('Page 1 of 2');
    await expect(again).resolves.toBe(true);
  });

  it('empties the region before repeating a message when asked to repeat', async () => {
    const announcer = new Announcer({ repeat: true });
    void announcer.announce('Page 1 of 2');
    await vi.runAllTimersAsync();

    void announcer.announce('Page 1 of 2');
    await vi.advanceTimersByTimeAsync(0);
    expect(announcer.message).toBe('');
    await vi.runAllTimersAsync();
    expect(announcer.message).toBe('Page 1 of 2');
  });

  it('clears the message after clearAfter', async () => {
    const announcer = new Announcer({ clearAfter: 5000 });

    void announcer.announce('Page 2 of 3');
    await vi.advanceTimersByTimeAsync(0);
    expect(announcer.message).toBe('Page 2 of 3');
    await vi.advanceTimersByTimeAsync(5000);
    expect(announcer.message).toBe('');
  });

  it('cancel() drops a pending message', async () => {
    const announcer = new Announcer({ delay: 100 });

    const pending = announcer.announce('never');
    announcer.cancel();
    await vi.runAllTimersAsync();

    expect(announcer.message).toBe('');
    await expect(pending).resolves.toBe(false);
  });
});

describe('LiveRegion', () => {
  it('is a polite status region by default', () => {
    render(LiveRegion, { message: '3 results', 'aria-label': 'Search results' });

    const region = screen.getByRole('status', { name: 'Search results' });
    expect(region).toHaveTextContent('3 results');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('is an alert when assertive', () => {
    render(LiveRegion, { message: 'Save failed', politeness: 'assertive' });

    expect(screen.getByRole('alert')).toHaveTextContent('Save failed');
  });
});
