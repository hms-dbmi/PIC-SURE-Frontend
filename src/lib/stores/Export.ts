import { get, writable, type Writable } from 'svelte/store';

import type { Export } from '$lib/models/Export';

const exports: Writable<Export[]> = writable([]);

function addExport(exportedField: Export) {
  const currentExports = get(exports);
  exports.set([...currentExports, exportedField]);
  return exportedField;
}

function removeExport(variableId: string) {
  const currentExports = get(exports);
  exports.set(
    currentExports.filter((e: Export) =>
      e.studyId
        ? e.variableId !== variableId && e.studyId !== variableId
        : e.variableId !== variableId,
    ),
  );
}

export default {
  subscribe: exports.subscribe,
  exports,
  addExport,
  removeExport,
};
