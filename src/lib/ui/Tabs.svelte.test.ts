// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import Tabs from '#lib/ui/Tabs.svelte';

const tabs = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];
const panel = createRawSnippet((value: () => string) => ({
  render: () => `<p>${value()} content</p>`,
}));

function renderTabs(value = 'one', onchange = vi.fn()) {
  const result = render(Tabs, { tabs, value, onchange, label: 'Sections', panel });
  return { ...result, onchange };
}

describe('Tabs', () => {
  it('marks only the selected tab as selected and shows only its panel', () => {
    renderTabs('two');

    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Two' })).toHaveTextContent('two content');
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  });

  it('puts the shown panel in the tab order, for panels with nothing focusable', () => {
    renderTabs('two');

    expect(screen.getByRole('tabpanel', { name: 'Two' })).toHaveAttribute('tabindex', '0');
  });

  it('keeps hidden panels mounted', () => {
    renderTabs();

    expect(screen.getByText('three content')).not.toBeVisible();
  });

  it('asks the owner to change tabs instead of changing on its own', async () => {
    const { onchange } = renderTabs();

    await fireEvent.click(screen.getByRole('tab', { name: 'Three' }));

    expect(onchange).toHaveBeenCalledExactlyOnceWith('three', { focus: false });
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });

  it('does not report a click on the selected tab', async () => {
    const { onchange } = renderTabs();

    await fireEvent.click(screen.getByRole('tab', { name: 'One' }));

    expect(onchange).not.toHaveBeenCalled();
  });

  it('roves focus with the arrow, Home and End keys once the owner selects', async () => {
    const onchange = vi.fn();
    const { rerender } = renderTabs('one', onchange);
    onchange.mockImplementation((value: string) => void rerender({ value }));
    const one = screen.getByRole('tab', { name: 'One' });
    const three = screen.getByRole('tab', { name: 'Three' });
    expect(one).toHaveAttribute('tabindex', '0');
    expect(three).toHaveAttribute('tabindex', '-1');

    one.focus();
    await fireEvent.keyDown(one, { key: 'ArrowLeft' });
    await waitFor(() => expect(three).toHaveFocus());
    expect(onchange).toHaveBeenLastCalledWith('three', { focus: true });
    expect(three).toHaveAttribute('tabindex', '0');

    await fireEvent.keyDown(three, { key: 'ArrowRight' });
    await waitFor(() => expect(one).toHaveFocus());

    await fireEvent.keyDown(one, { key: 'End' });
    await waitFor(() => expect(three).toHaveFocus());

    await fireEvent.keyDown(three, { key: 'Home' });
    await waitFor(() => expect(one).toHaveFocus());
  });

  it('leaves focus alone when the owner defers a keyboard change', async () => {
    renderTabs();
    const one = screen.getByRole('tab', { name: 'One' });

    one.focus();
    await fireEvent.keyDown(one, { key: 'ArrowRight' });

    expect(one).toHaveFocus();
  });
});
