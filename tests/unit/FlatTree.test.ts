import { describe, it, expect } from 'vitest';

import { Operator } from '$lib/models/query/Query';
import { FlatFilterTree } from '$lib/models/FlatTree';

describe('FlatFilterTree Model', () => {
  it('has no operator when there is one filter', () => {
    const tree = new FlatFilterTree(['A']);

    expect(tree.filters.length).toBe(1);
    expect(tree.operators.length).toBe(0);
  });
  it('add has new default AND operator', () => {
    const tree = new FlatFilterTree(['A']);

    tree.add('B');

    expect(tree.filters.length).toBe(2);
    expect(tree.operators.length).toBe(1);
    expect(tree.toString).toBe('A AND B');
  });
  it('has default AND operator', () => {
    const tree = new FlatFilterTree(['A', 'B']);

    expect(tree.filters.length).toBe(2);
    expect(tree.operators.length).toBe(1);
    expect(tree.toString).toBe('A AND B');
  });
  it('filter operator change is correct', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D']);

    tree.swap('B', Operator.OR, 'C');

    expect(tree.filters.length).toBe(4);
    expect(tree.operators.length).toBe(3);
    expect(tree.toString).toBe('A AND B OR C AND D');
  });
  it('remove all - no operators', () => {
    const tree = new FlatFilterTree(['A']);

    tree.remove('A');

    expect(tree.filters.length).toBe(0);
    expect(tree.operators.length).toBe(0);
    expect(tree.toString).toBe('');
  });
  it('remove one - no operators', () => {
    const tree = new FlatFilterTree(['A', 'B']);

    tree.remove('A');

    expect(tree.filters.length).toBe(1);
    expect(tree.operators.length).toBe(0);
    expect(tree.toString).toBe('B');
  });
  it('remove one - one operator', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C']);

    tree.remove('C');

    expect(tree.filters.length).toBe(2);
    expect(tree.operators.length).toBe(1);
    expect(tree.toString).toBe('A AND B');
  });
  it('removal operators before and after are AND', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D']);

    tree.remove('C');

    expect(tree.filters.length).toBe(3);
    expect(tree.operators.length).toBe(2);
    expect(tree.toString).toBe('A AND B AND D');
  });
  it('removal operators before and after are OR', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D']);

    tree.swap('A', Operator.OR, 'B');
    tree.swap('B', Operator.OR, 'C');
    tree.remove('B');

    expect(tree.filters.length).toBe(3);
    expect(tree.operators.length).toBe(2);
    expect(tree.toString).toBe('A OR C AND D');
  });
  it('removal operators before operator is OR', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D']);

    tree.swap('B', Operator.OR, 'C');
    tree.remove('C');

    expect(tree.filters.length).toBe(3);
    expect(tree.operators.length).toBe(2);
    expect(tree.toString).toBe('A AND B AND D');
  });
  it('removal operators after operator is OR', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D']);
    tree.swap('C', Operator.OR, 'D');

    tree.remove('C');

    expect(tree.filters.length).toBe(3);
    expect(tree.operators.length).toBe(2);
    expect(tree.toString).toBe('A AND B AND D');
  });
  it('correctly generates simple tree', () => {
    const tree = new FlatFilterTree(['A', 'B']);

    expect(tree.toString).toBe('A AND B');
    expect(tree.clauseTree.toString).toBe('{operator:AND;clauses:[A,B]}');
  });
  it('correctly generates max 1 depth clause tree', () => {
    const tree = new FlatFilterTree(['A', 'B', 'C', 'D', 'E']);

    tree.swap('B', Operator.OR, 'C');
    tree.swap('D', Operator.OR, 'E');

    expect(tree.toString).toBe('A AND B OR C AND D OR E');
    expect(tree.clauseTree.toString).toBe(
      '{operator:AND;clauses:[A,{operator:OR;clauses:[B,C]},{operator:OR;clauses:[D,E]}]}',
    );
  });
});
