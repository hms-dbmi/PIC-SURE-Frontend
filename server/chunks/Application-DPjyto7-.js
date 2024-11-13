import { d as derived, w as writable } from './index2-CV6P_ZFI.js';
import { d as get } from './User-DwYSDSFP.js';
import { g as get_store_value } from './lifecycle-GVhEEkqU.js';

const APP_URL = "psama/application";
const loaded = writable(false);
const applications = writable([]);
const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]), []);
async function loadApplications() {
  if (get_store_value(loaded)) return;
  const res = await get(APP_URL);
  applications.set(res);
  loaded.set(true);
}
function getApplication(uuid) {
  const store = get_store_value(applications);
  return store.find((a) => a.uuid === uuid);
}
const ApplicationStore = {
  subscribe: applications.subscribe,
  applications,
  applicationList,
  loadApplications,
  getApplication
};

export { ApplicationStore as A };
//# sourceMappingURL=Application-DPjyto7-.js.map
