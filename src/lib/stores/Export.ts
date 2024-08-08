import { get, writable, type Writable } from 'svelte/store';

import type { ExportInterface } from '$lib/models/Export';

const exports: Writable<ExportInterface[]> = writable([]);

function addExport(exportedField: ExportInterface) {
  const currentExports = get(exports);
  if (currentExports.some((e: ExportInterface) => e.id === exportedField.id)) {
    return;
  }
  exports.set([...currentExports, exportedField]);
  return exportedField;
}

function removeExport(uuid: string) {
  const currentExports = get(exports);
  exports.set(
    currentExports.filter((e: ExportInterface) =>
      e.studyId ? e.id !== uuid && e.studyId !== uuid : e.id !== uuid,
    ),
  );
}

export function clearExports() {
  exports.set([]);
}

export default {
  subscribe: exports.subscribe,
  exports,
  addExport,
  removeExport,
  clearExports,
};
