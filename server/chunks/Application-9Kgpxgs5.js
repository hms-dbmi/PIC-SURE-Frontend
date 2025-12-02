import { o as derived, w as writable, l as get } from './utils-D3IkxnGP.js';
import { a6 as get$1, a8 as Psama } from './User-CeJunCPd.js';

const loaded = writable(false);
const applications = writable([]);
const applicationList = derived(applications, ($a) => $a.map((a) => [a.name, a.uuid]), []);
async function loadApplications() {
  if (get(loaded)) return;
  const res = await get$1(Psama.Application);
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
//# sourceMappingURL=Application-9Kgpxgs5.js.map
