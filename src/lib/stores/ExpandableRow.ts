import type { SvelteComponent } from 'svelte';
import { get, writable, type Writable } from 'svelte/store';

export const activeTable: Writable<string> = writable('');
export const activeRow: Writable<string> = writable('');
export const expandableComponents: Writable<Record<string, typeof SvelteComponent>> = writable({});
export const defaultComponent: Writable<typeof SvelteComponent | undefined> = writable();
export const activeComponent: Writable<typeof SvelteComponent | undefined> = writable();

export function setActiveRow(options: {
  row: string;
  component?: typeof SvelteComponent;
  table?: string;
}) {
  const { row, table, component } = options;
  const sameRow = get(activeRow) === row;
  const sameComponent = !component || get(activeComponent) === component;
  const sameTable = !table || get(activeTable) === table;

  if (sameRow && sameComponent && sameTable) {
    activeRow.set('');
    activeComponent.set(get(defaultComponent));
  } else {
    activeRow.set(row);
    table && activeTable.set(table);
    component && activeComponent.set(component);
  }
}

// TODO: Bug? Why not typeof SvelteComponent?
export function setComponentRegistry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registry: Record<string, new (...args: any[]) => SvelteComponent>,
  component?: string,
  table?: string,
) {
  activeTable.set(table ? table : '');
  activeRow.set('');
  expandableComponents.set(registry);
  defaultComponent.set(component ? registry[component] : undefined);
  activeComponent.set(component ? registry[component] : undefined);
}
