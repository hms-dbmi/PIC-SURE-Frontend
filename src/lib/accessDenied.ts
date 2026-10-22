import { writable } from 'svelte/store';

// Raised by a forbidden logout until it has navigated away. It lives apart from the filter store
// that reacts to it because that store imports api.ts and User.ts, which raise and lower it.
export const accessDenied = writable(false);
