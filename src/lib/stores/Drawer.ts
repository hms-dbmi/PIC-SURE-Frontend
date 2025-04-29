import { writable, type Writable } from 'svelte/store';

export const open: Writable<boolean> = writable(false);
