import type { EventDispatcher } from 'svelte';

export interface StepperState {
  current: number;
  total: number;
  stepMap: string[];
}

interface StepAction {
  step: number;
  name: string;
  state: StepperState;
}

export type StepperButton = 'submit' | 'reset' | 'button';

export type StepperEvent = {
  next: StepAction;
  step: StepAction;
  back: StepAction;
  complete: StepAction;
};

export type StepperEventDispatcher = EventDispatcher<StepperEvent>;
