import { s as stores } from './client2-2LGcfZLB.js';
import { K as getContext } from './index-BYsoXH7a.js';

({
  check: stores.updated.check
});

function context() {
  return getContext("__request__");
}
const page$1 = {
  get data() {
    return context().page.data;
  },
  get error() {
    return context().page.error;
  },
  get params() {
    return context().page.params;
  },
  get status() {
    return context().page.status;
  },
  get url() {
    return context().page.url;
  }
};
const page = page$1;

export { page as p };
//# sourceMappingURL=index2-DXnmzf54.js.map
