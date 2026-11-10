// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';

import RadioTreeNode from '#lib/components/tree/RadioTreeNode.svelte';
import type { RadioNodeInterface } from '#lib/components/tree/types.ts';

function node(name: string, children: RadioNodeInterface[] = []): RadioNodeInterface {
  return {
    name,
    value: name,
    selected: false,
    disabled: false,
    children,
    isLeaf: children.length === 0,
    select: vi.fn(),
  };
}

describe('RadioTreeNode', () => {
  it('names the radio of a parent node as well as a leaf', () => {
    render(RadioTreeNode, { node: node('Parent', [node('Child')]), index: 0, isRoot: true });

    expect(screen.getByLabelText('Parent')).toHaveAttribute('type', 'radio');
    expect(screen.getByLabelText('Child')).toHaveAttribute('type', 'radio');
  });

  it('selects a leaf, but not a parent, when its name is clicked', async () => {
    const child = node('Child');
    const parent = node('Parent', [child]);
    render(RadioTreeNode, { node: parent, index: 0, isRoot: true });

    await fireEvent.click(screen.getByText('Parent'));
    await fireEvent.click(screen.getByText('Child'));

    expect(parent.select).not.toHaveBeenCalled();
    expect(child.select).toHaveBeenCalledOnce();
  });
});
