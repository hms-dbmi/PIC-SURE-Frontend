import { J as getContext } from './index-BKfiikQf.js';
import './client-HRCS46UK.js';

const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};

export { page as p };
//# sourceMappingURL=stores-DhwnhD2d.js.map
