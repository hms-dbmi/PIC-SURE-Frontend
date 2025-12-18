export type Indexable = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface Indexed<T> {
  [key: string]: T;
}

export interface Step {
  label: string;
  icon: string;
  description?: string;
  path?: string;
}

export class AnyRecordOfFilterError extends Error {
  constructor(message: string) {
    super(message);
  }
}
