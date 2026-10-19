// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import HelpTip from '#lib/ui/popover/HelpTip.svelte';

function renderTip(onopen = vi.fn()) {
  render(HelpTip, { text: 'Some <b>help</b>', 'data-testid': 'tip', onopen });
  return { onopen, trigger: screen.getByRole('button', { name: 'More information' }) };
}

describe('HelpTip', () => {
  afterEach(() => vi.useRealTimers());

  it('opens a tooltip that describes its trigger on click', async () => {
    const { onopen, trigger } = renderTip();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(trigger);

    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('Some help');
    expect(trigger).toHaveAttribute('aria-describedby', tip.id);
    expect(onopen).toHaveBeenCalledExactlyOnceWith('click');
  });

  it('closes on a second click, on Escape and on a press outside', async () => {
    const { trigger } = renderTip();

    await fireEvent.click(trigger);
    await fireEvent.click(trigger);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());

    await fireEvent.click(trigger);
    await fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());

    await fireEvent.click(trigger);
    await fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('opens once the pointer rests on it and closes when the pointer leaves', async () => {
    vi.useFakeTimers();
    const { onopen, trigger } = renderTip();

    await fireEvent.mouseMove(trigger);
    await fireEvent.mouseLeave(trigger);
    vi.advanceTimersByTime(500);
    expect(screen.queryByRole('tooltip')).toBeNull();

    await fireEvent.mouseMove(trigger);
    await vi.advanceTimersByTimeAsync(200);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(onopen).toHaveBeenCalledExactlyOnceWith('hover');

    await fireEvent.mouseLeave(trigger);
    await vi.advanceTimersByTimeAsync(300);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('stays open when the pointer leaves after a click pinned it', async () => {
    vi.useFakeTimers();
    const { onopen, trigger } = renderTip();

    await fireEvent.mouseMove(trigger);
    await vi.advanceTimersByTimeAsync(200);
    await fireEvent.click(trigger);
    await fireEvent.mouseLeave(trigger);
    await vi.advanceTimersByTimeAsync(300);

    expect(screen.getByRole('tooltip')).toBeTruthy();
    expect(onopen.mock.calls).toEqual([['hover'], ['click']]);
  });
});
