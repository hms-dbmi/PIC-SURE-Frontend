import type { StepperState } from '$lib/models/Stepper';
import { writable, type Writable } from 'svelte/store';

export const state: Writable<StepperState> = writable({ current: 0, total: 0 });
