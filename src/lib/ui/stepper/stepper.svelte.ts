import { createContext } from 'svelte';

export class StepperState {
  current = $state(0);
  stepMap: string[] = $state([]);

  get total() {
    return this.stepMap.length;
  }

  /** Adds a step in mount order and returns its index. */
  register(name: string) {
    this.stepMap.push(name);
    return this.stepMap.length - 1;
  }

  unregister(name: string) {
    this.stepMap = this.stepMap.filter((item) => item !== name);
  }
}

export interface StepperContext {
  state: StepperState;
  readonly buttonCompleteLabel: string;
  next: (locked: boolean) => Promise<void>;
  back: () => void;
  complete: (stepIndex: number, locked: boolean) => void;
}

export const [getStepper, setStepper] = createContext<StepperContext>();
