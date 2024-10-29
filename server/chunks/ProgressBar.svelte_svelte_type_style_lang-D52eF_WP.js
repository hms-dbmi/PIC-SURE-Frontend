import { r as readable, w as writable } from './index2-CV6P_ZFI.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';

const stores = {};
function localStorageStore(key, initialValue, options) {
  if (!stores[key]) {
    const store = writable(initialValue, (set2) => {
    });
    const { subscribe, set } = store;
    stores[key] = {
      set(value) {
        set(value);
      },
      update(updater) {
        const value = updater(get_store_value(store));
        set(value);
      },
      subscribe
    };
  }
  return stores[key];
}
localStorageStore("modeOsPrefers", false);
localStorageStore("modeUserPrefers", void 0);
localStorageStore("modeCurrent", false);
function prefersReducedMotion() {
  return false;
}
const prefersReducedMotionStore = readable(prefersReducedMotion(), (set) => {
});

export { prefersReducedMotionStore as p };
//# sourceMappingURL=ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js.map
