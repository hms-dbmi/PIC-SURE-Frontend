import type { Component } from 'svelte';
import { get, writable, type Writable } from 'svelte/store';

import AddFilterComponent from '$lib/components/explorer/AddFilter.svelte';
import ResultInfoComponent from '$lib/components/explorer/ResultInfoComponent.svelte';
import HierarchyComponent from '$lib/components/explorer/HierarchyComponent.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentObject = Component<any, any, string>;

const components: { [key: string]: () => ComponentObject } = {
  filter: () => AddFilterComponent,
  info: () => ResultInfoComponent,
  hierarchy: () => HierarchyComponent,
};

export const activeTable: Writable<string> = writable('');
export const activeRow: Writable<string> = writable('');
export const defaultComponent: Writable<ComponentObject | undefined> = writable(components.info());
export const activeComponent: Writable<ComponentObject | undefined> = writable(components.info());

export function setActiveRow(options: { row: string; component?: string; table?: string }) {
  const { row, table, component: componentName } = options;
  const sameRow = get(activeRow) === row;
  const sameComponent = !componentName || get(activeComponent) === components[componentName]();
  const sameTable = !table || get(activeTable) === table;

  if (sameRow && sameComponent && sameTable) {
    activeRow.set('');
    activeComponent.set(get(defaultComponent));
  } else {
    activeRow.set(row);
    table && activeTable.set(table);
    componentName ? activeComponent.set(components[componentName]()) : activeComponent.set(get(defaultComponent));
  }
}
