import { x as push, K as escape_html, z as pop } from './index-C5NonOVO.js';
import { p as page } from './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';

function _error($$payload, $$props) {
  push();
  $$payload.out += `<h1>${escape_html(page.status)}: ${escape_html(page?.error?.message ?? "An unkown error occured.")}</h1>`;
  pop();
}

export { _error as default };
//# sourceMappingURL=_error.svelte-BBsQTjDs.js.map
