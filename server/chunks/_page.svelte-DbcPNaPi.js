import { x as push, a8 as head, z as pop, M as escape_html } from './index-DMPVr6nO.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { V as Visualizations } from './Visualizations-CEdxlzbe.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import '@sveltejs/kit';
import './User-01eW3TFo.js';
import './index2-Bp7szfwE.js';
import './Filter-Bhec34ty.js';
import 'uuid';
import './Export-B3PQrADV.js';
import './Loading-DAyWVuL0.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Distributions</title>`;
  });
  Content($$payload, {
    full: true,
    backUrl: "/explorer",
    backTitle: "Back to Explore",
    title: "Variable Distributions",
    children: ($$payload2) => {
      Visualizations($$payload2);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DbcPNaPi.js.map
