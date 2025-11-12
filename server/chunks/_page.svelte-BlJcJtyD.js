import { x as push, a4 as head, z as pop, M as escape_html } from './index-BYsoXH7a.js';
import { f as features, b as branding } from './configuration-wjj69jIJ.js';
import { C as Content } from './Content-D47GFKQW.js';
import { E as Explorer, T as TourData } from './TourConfiguration-CQTHCHZD.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './index2-DXnmzf54.js';
import './Dictionary-SO9EnU4C.js';
import './User-CGCqDR6a.js';
import '@sveltejs/kit';
import './Filter-D4fknGLB.js';
import 'uuid';
import './Loading-D4A6B7i5.js';
import './Export-BN3JIXjt.js';
import './RemoteTable-fo4XXOhh.js';
import './AddFilter-DdRxu9jO.js';
import './OptionsSelectionList-B-cROXFf.js';
import './Modal-CHSSe0AJ.js';
import './ErrorAlert-BJMruCzq.js';
import './Searchbox-BFhJjEkJ.js';
import './create-context-CreHy-BA.js';
import 'driver.js';
import './HTML-1Mhr8hI4.js';
import 'dompurify';
import './html2-FW6Ia4bL.js';

function _page($$payload, $$props) {
  push();
  const Tour = TourData;
  const tourName = features.explorer.authTour;
  let authTour = void 0;
  if (tourName !== void 0 && tourName in Tour) {
    authTour = Tour[tourName];
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Explorer</title>`;
  });
  Content($$payload, {
    full: true,
    children: ($$payload2) => {
      Explorer($$payload2, { tourConfig: authTour });
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BlJcJtyD.js.map
