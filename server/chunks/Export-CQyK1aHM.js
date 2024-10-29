import { w as writable } from './index2-CV6P_ZFI.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';

const exports = writable([]);
function addExport(exportedField) {
  const currentExports = get_store_value(exports);
  if (currentExports.some((e) => e.id === exportedField.id)) {
    return;
  }
  exports.set([...currentExports, exportedField]);
  return exportedField;
}
function removeExport(uuid) {
  const currentExports = get_store_value(exports);
  exports.set(
    currentExports.filter(
      (e) => e.studyId ? e.id !== uuid && e.studyId !== uuid : e.id !== uuid
    )
  );
}
function clearExports() {
  exports.set([]);
}
const ExportStore = {
  subscribe: exports.subscribe,
  exports,
  addExport,
  removeExport,
  clearExports
};

export { ExportStore as E, clearExports as c };
//# sourceMappingURL=Export-CQyK1aHM.js.map
