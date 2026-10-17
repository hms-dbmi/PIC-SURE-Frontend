// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';

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
    select: () => {},
  };
}

describe('RadioTreeNode', () => {
  it('labels the radio of a parent node as well as a leaf', () => {
    render(RadioTreeNode, { node: node('Parent', [node('Child')]), index: 0, isRoot: true });

    expect(screen.getByLabelText('Parent')).toHaveAttribute('type', 'radio');
    expect(screen.getByLabelText('Child')).toHaveAttribute('type', 'radio');
  });
});
