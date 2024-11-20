import { w as writable } from './index2-BVONNh3m.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

const exports = writable([]);
function addExport(exportedField) {
  const currentExports = get_store_value(exports);
  if (currentExports.some((e) => e.id === exportedField.id)) {
    return;
  }
  exports.set([...currentExports, exportedField]);
  return exportedField;
}
function addExports(exportedFields) {
  const currentExports = get_store_value(exports);
  const newExports = exportedFields.filter(
    (e) => !currentExports.some((ce) => ce.id === e.id)
  );
  exports.set([...currentExports, ...newExports]);
}
function removeExport(uuid) {
  const currentExports = get_store_value(exports);
  exports.set(
    currentExports.filter(
      (e) => e.studyId ? e.id !== uuid && e.studyId !== uuid : e.id !== uuid
    )
  );
}
function removeExports(exportsToRemove) {
  const currentExports = get_store_value(exports);
  exports.set(currentExports.filter((e) => !exportsToRemove.includes(e)));
}
function clearExports() {
  exports.set([]);
}
const ExportStore = {
  subscribe: exports.subscribe,
  exports,
  addExport,
  addExports,
  removeExport,
  removeExports,
  clearExports
};

export { ExportStore as E, clearExports as c };
//# sourceMappingURL=Export-BO8S-sxn.js.map
