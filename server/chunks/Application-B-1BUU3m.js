import { i as derived, w as writable, h as get } from './exports-Cnt0TmSD.js';
import { Q as get$1, U as Psama } from './User-ByrNDeqq.js';

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
//# sourceMappingURL=Application-B-1BUU3m.js.map
