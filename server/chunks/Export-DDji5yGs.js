import { w as writable } from './index2-Bx7ZSImw.js';
import { g as get_store_value } from './utils-EiTRXYbg.js';

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
//# sourceMappingURL=Export-DDji5yGs.js.map
