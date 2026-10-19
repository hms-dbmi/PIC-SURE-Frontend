// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';

import TreeView from '#lib/ui/tree/TreeView.svelte';
import type { TreeNodeInit } from '#lib/ui/tree/treeModel.svelte.ts';

function leaf(label: string, extra: Partial<TreeNodeInit<string>> = {}): TreeNodeInit<string> {
  return { name: label, value: label, label, payload: label, ...extra };
}

function parent(
  label: string,
  children: TreeNodeInit<string>[],
  extra: Partial<TreeNodeInit<string>> = {},
): TreeNodeInit<string> {
  return { ...leaf(label), children, ...extra };
}

const severities = () => [
  parent('High', [leaf('stop_lost'), leaf('start_lost')]),
  parent('Low', [leaf('synonymous')]),
];

const item = (name: string) => screen.getByRole('treeitem', { name });

async function press(key: string) {
  await fireEvent.keyDown(document.activeElement!, { key });
}

describe('TreeView', () => {
  it('is a named tree of items with levels and expansion state', () => {
    render(TreeView, {
      nodes: [parent('High', [leaf('stop_lost')], { open: true })],
      label: 'Tree',
    });

    expect(screen.getByRole('tree', { name: 'Tree' })).toBeTruthy();
    expect(item('High')).toHaveAttribute('aria-expanded', 'true');
    expect(item('High')).toHaveAttribute('aria-level', '1');
    expect(item('stop_lost')).toHaveAttribute('aria-level', '2');
    expect(item('stop_lost')).not.toHaveAttribute('aria-expanded');
  });

  it('reports partial selection as aria-checked="mixed"', async () => {
    const onselect = vi.fn();
    render(TreeView, { nodes: severities(), label: 'Tree', onselect, expandOnSelect: true });

    await fireEvent.click(screen.getByTestId('ui-tree-toggle-High-High'));
    await fireEvent.click(screen.getByText('stop_lost'));

    expect(onselect).toHaveBeenCalledExactlyOnceWith('stop_lost');
    expect(item('stop_lost')).toHaveAttribute('aria-checked', 'true');
    expect(item('High')).toHaveAttribute('aria-checked', 'mixed');
    expect(item('Low')).toHaveAttribute('aria-checked', 'false');

    await fireEvent.click(screen.getByText('start_lost'));
    expect(item('High')).toHaveAttribute('aria-checked', 'true');
  });

  it('selects and unselects every leaf under a parent', async () => {
    const onselect = vi.fn();
    const onunselect = vi.fn();
    render(TreeView, {
      nodes: severities(),
      label: 'Tree',
      onselect,
      onunselect,
      expandOnSelect: true,
    });
    const checkbox = screen.getByTestId('ui-tree-checkbox-High-High');

    await fireEvent.click(checkbox);
    await waitFor(() => expect(item('High')).toHaveAttribute('aria-checked', 'true'));
    expect(item('High')).toHaveAttribute('aria-expanded', 'true');
    expect(onselect.mock.calls).toEqual([['stop_lost'], ['start_lost']]);

    await fireEvent.click(checkbox);
    await waitFor(() => expect(item('High')).toHaveAttribute('aria-checked', 'false'));
    expect(onunselect.mock.calls).toEqual([['stop_lost'], ['start_lost']]);
  });

  it('keeps a single tab stop that follows focus', async () => {
    render(TreeView, { nodes: severities(), label: 'Tree' });

    expect(item('High')).toHaveAttribute('tabindex', '0');
    expect(item('Low')).toHaveAttribute('tabindex', '-1');

    item('High').focus();
    await press('ArrowDown');

    expect(document.activeElement).toBe(item('Low'));
    expect(item('Low')).toHaveAttribute('tabindex', '0');
    expect(item('High')).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrow keys, Home and End, and opens and closes with Right and Left', async () => {
    render(TreeView, { nodes: severities(), label: 'Tree' });
    item('High').focus();

    await press('ArrowRight');
    expect(item('High')).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(item('High'));

    await press('ArrowRight');
    expect(document.activeElement).toBe(item('stop_lost'));

    await press('ArrowDown');
    expect(document.activeElement).toBe(item('start_lost'));

    await press('ArrowLeft');
    expect(document.activeElement).toBe(item('High'));

    await press('End');
    expect(document.activeElement).toBe(item('Low'));

    await press('Home');
    expect(document.activeElement).toBe(item('High'));

    await press('ArrowLeft');
    expect(item('High')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('treeitem', { name: 'stop_lost' })).toBeNull();

    await press('ArrowUp');
    expect(document.activeElement).toBe(item('High'));
  });

  it('toggles selection with Space and opens a parent with Enter', async () => {
    const onselect = vi.fn();
    render(TreeView, { nodes: severities(), label: 'Tree', onselect });
    item('Low').focus();

    await press('Enter');
    expect(item('Low')).toHaveAttribute('aria-expanded', 'true');

    await press('ArrowDown');
    await press(' ');
    expect(item('synonymous')).toHaveAttribute('aria-checked', 'true');
    expect(onselect).toHaveBeenCalledExactlyOnceWith('synonymous');

    await press(' ');
    expect(item('synonymous')).toHaveAttribute('aria-checked', 'false');
  });

  it('leaves disabled nodes unchanged', async () => {
    const onselect = vi.fn();
    render(TreeView, {
      nodes: [leaf('fixed', { disabled: true })],
      label: 'Tree',
      onselect,
    });
    item('fixed').focus();

    await press(' ');
    await fireEvent.click(screen.getByText('fixed'));

    expect(item('fixed')).toHaveAttribute('aria-disabled', 'true');
    expect(item('fixed')).toHaveAttribute('aria-checked', 'false');
    expect(onselect).not.toHaveBeenCalled();
  });

  describe('single select', () => {
    const chain = () => [
      parent('Root', [parent('Middle', [leaf('Variable', { selected: true })], { open: true })], {
        open: true,
      }),
    ];

    it('names every radio, parents included', () => {
      render(TreeView, { nodes: chain(), label: 'Tree', selection: 'single' });

      expect(screen.getByRole('radio', { name: 'Root' })).toBeTruthy();
      expect(screen.getByRole('radio', { name: 'Variable' })).toBeTruthy();
    });

    it("opens a parent when its name is clicked and selects a leaf's", async () => {
      const onselect = vi.fn();
      render(TreeView, { nodes: chain(), label: 'Tree', selection: 'single', onselect });

      await fireEvent.click(screen.getByText('Middle'));
      expect(item('Middle')).toHaveAttribute('aria-expanded', 'false');
      expect(onselect).not.toHaveBeenCalled();

      await fireEvent.click(screen.getByText('Middle'));
      await fireEvent.click(screen.getByText('Variable'));
      expect(onselect).toHaveBeenCalledExactlyOnceWith('Variable');
    });

    it('checks one node at a time', async () => {
      const onselect = vi.fn();
      render(TreeView, { nodes: chain(), label: 'Tree', selection: 'single', onselect });

      expect(item('Variable')).toHaveAttribute('aria-checked', 'true');
      expect(item('Variable')).toHaveAttribute('tabindex', '0');

      item('Variable').focus();
      await press('ArrowUp');
      await press(' ');

      expect(onselect).toHaveBeenCalledExactlyOnceWith('Middle');
      expect(item('Middle')).toHaveAttribute('aria-checked', 'true');
      expect(item('Variable')).toHaveAttribute('aria-checked', 'false');
      expect(item('Root')).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('lazy children', () => {
    const folder = () => [parent('study', [], { lazy: true })];

    it('loads children once, when a node first opens', async () => {
      const loadChildren = vi.fn().mockResolvedValue([leaf('age'), leaf('sex')]);
      render(TreeView, { nodes: folder(), label: 'Tree', loadChildren });
      expect(loadChildren).not.toHaveBeenCalled();

      item('study').focus();
      await press('ArrowRight');

      expect(await screen.findByRole('treeitem', { name: 'age' })).toBeTruthy();
      await press('ArrowLeft');
      await press('ArrowRight');
      expect(loadChildren).toHaveBeenCalledExactlyOnceWith('study');
    });

    it('loads the children of an unopened node before selecting them', async () => {
      const onselect = vi.fn();
      const loadChildren = vi.fn().mockResolvedValue([leaf('age'), leaf('sex')]);
      render(TreeView, { nodes: folder(), label: 'Tree', loadChildren, onselect });

      await fireEvent.click(screen.getByTestId('ui-tree-checkbox-study-study'));

      await waitFor(() => expect(onselect.mock.calls).toEqual([['age'], ['sex']]));
      expect(item('study')).toHaveAttribute('aria-checked', 'true');
      expect(item('study')).toHaveAttribute('aria-expanded', 'false');
    });

    it('turns a node with no children into a leaf', async () => {
      const loadChildren = vi.fn().mockResolvedValue(null);
      render(TreeView, { nodes: folder(), label: 'Tree', loadChildren });

      await fireEvent.click(screen.getByTestId('ui-tree-toggle-study-study'));

      await waitFor(() => expect(item('study')).not.toHaveAttribute('aria-expanded'));
    });

    it('shows a fixed message, never the error text, when children fail to load', async () => {
      const loadChildren = vi.fn().mockRejectedValue(new Error('<!doctype html><body>500</body>'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      render(TreeView, { nodes: folder(), label: 'Tree', loadChildren });

      await fireEvent.click(screen.getByTestId('ui-tree-toggle-study-study'));

      expect(
        await screen.findByText('Error loading children: Failed to load children'),
      ).toBeTruthy();
      expect(document.body.textContent).not.toContain('doctype');
    });
  });
});
