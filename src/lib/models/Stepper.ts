export interface StepperState {
  current: number;
  total: number;
  stepMap: string[];
}

export type StepperButton = 'submit' | 'reset' | 'button';
