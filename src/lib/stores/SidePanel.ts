import { writable } from 'svelte/store';
import { features } from '$lib/configuration';

export const panelOpen = writable(features.showResultPanel);
