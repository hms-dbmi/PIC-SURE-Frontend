import { i as derived, w as writable, h as get } from './exports-CKriv3vT.js';
import { g as get$1 } from './User-DPh8mmLT.js';

const APP_URL = "psama/application";
const loaded = writable(false);
const applications = writable([]);
const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]), []);
async function loadApplications() {
  if (get(loaded)) return;
  const res = await get$1(APP_URL);
  applications.set(res);
  loaded.set(true);
}
function getApplication(uuid) {
  const store = get(applications);
  return store.find((a) => a.uuid === uuid);
}
const ApplicationStore = {
  subscribe: applications.subscribe,
  applicationList,
  loadApplications
};

export { ApplicationStore as A, applicationList as a, getApplication as g, loadApplications as l };
//# sourceMappingURL=Application-DC9Zpzca.js.map
