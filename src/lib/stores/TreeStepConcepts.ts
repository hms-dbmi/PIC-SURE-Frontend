import { get, writable, type Writable } from 'svelte/store';

export const selectedConcepts: Writable<string[]> = writable([]);
export const disabledConcepts: Writable<string[]> = writable([]);

export function addConcept(conceptPath: string) {
  selectedConcepts.update((prev) => (prev.includes(conceptPath) ? prev : [...prev, conceptPath]));
}

export function removeConcept(conceptPath: string) {
  selectedConcepts.update((prev) => prev.filter((concept) => concept !== conceptPath));
}

export function toggleDisableConcept(conceptPath: string) {
  get(disabledConcepts).includes(conceptPath)
    ? disabledConcepts.update((prev) => prev.filter((concept) => concept !== conceptPath))
    : disabledConcepts.update((prev) =>
        prev.includes(conceptPath) ? prev : [...prev, conceptPath],
      );
}

export function clearSelectedConcepts() {
  selectedConcepts.set([]);
  disabledConcepts.set([]);
}

export default {
  subscribe: selectedConcepts.subscribe,
  selectedConcepts,
  addConcept,
  removeConcept,
  clearSelectedConcepts,
};
