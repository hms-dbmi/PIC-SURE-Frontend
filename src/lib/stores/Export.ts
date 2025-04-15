import { get, writable, type Writable } from 'svelte/store';

import type { ExportInterface } from '$lib/models/Export';

export const exports: Writable<ExportInterface[]> = writable([]);

export function addExport(exportedField: ExportInterface) {
  const currentExports = get(exports);
  if (currentExports.some((e: ExportInterface) => e.conceptPath === exportedField.conceptPath)) {
    return;
  }
  exports.set([...currentExports, exportedField]);
  return exportedField;
}

export function addExports(exportedFields: ExportInterface[]) {
  const currentExports = get(exports);
  const newExports = exportedFields.filter(
    (e: ExportInterface) =>
      !currentExports.some((ce: ExportInterface) => ce.conceptPath === e.conceptPath),
  );
  exports.set([...currentExports, ...newExports]);
}

export function removeExport(uuid: string) {
  const currentExports = get(exports);
  exports.set(
    currentExports.filter((e: ExportInterface) =>
      e.studyId ? e.id !== uuid && e.studyId !== uuid : e.id !== uuid,
    ),
  );
}

export function removeExports(exportsToRemove: ExportInterface[]) {
  const currentExports = get(exports);
  exports.set(
    currentExports.filter(
      (e: ExportInterface) => !exportsToRemove.some((re) => re.conceptPath === e.conceptPath),
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
  addExports,
  removeExport,
  removeExports,
  clearExports,
};
