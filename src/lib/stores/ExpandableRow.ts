import type { SvelteComponent } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export const activeRow: Writable<number> = writable(-1);
export const expandableComponents: Writable<Record<string, typeof SvelteComponent>> = writable({});
export const activeComponent: Writable<typeof SvelteComponent> = writable();
