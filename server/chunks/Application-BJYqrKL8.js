import { d as derived, w as writable } from './index2-BVONNh3m.js';
import { g as get } from './User-Cv0Sr19m.js';
import { g as get_store_value } from './lifecycle-DtuISP6h.js';

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

export { ApplicationStore as A, applicationList as a, loadApplications as l };
//# sourceMappingURL=Application-BJYqrKL8.js.map
