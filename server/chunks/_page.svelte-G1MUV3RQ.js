import { x as push, a8 as head, z as pop, M as escape_html } from './index-C9dy-hDW.js';
import { f as features, b as branding } from './configuration-BAm0JRx1.js';
import { C as Content } from './Content-B-tyG1Sn.js';
import { E as Explorer, T as TourData } from './TourConfiguration-BUkqab4p.js';
import './client2-BVaV_p61.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './index2-CFqWCRce.js';
import './Dictionary-Cym6J1qH.js';
import './User-CeJunCPd.js';
import '@sveltejs/kit';
import './Filter-DSKDPPqy.js';
import 'uuid';
import './Loading-Bei-CWQ1.js';
import './Export-DV6CwdT5.js';
import './RemoteTable-CuygI6T5.js';
import './AddFilter-1lfQ-1wP.js';
import './OptionsSelectionList-B6aTQUlC.js';
import './Modal-C5zQSBqd.js';
import './ErrorAlert-BNxDBqzK.js';
import './Searchbox-CmXpWjCV.js';
import './create-context-D9swWN1U.js';
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
//# sourceMappingURL=_page.svelte-G1MUV3RQ.js.map
