import { x as push, a8 as head, z as pop, M as escape_html } from './index-DMPVr6nO.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { f as features, b as branding } from './configuration-CBIXsjx2.js';
import { E as Explorer, T as TourData } from './TourConfiguration-DYSqKHpC.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';
import './index2-Bp7szfwE.js';
import './Dictionary-GEGKzEEq.js';
import './User-01eW3TFo.js';
import '@sveltejs/kit';
import './Filter-Bhec34ty.js';
import 'uuid';
import './Loading-DAyWVuL0.js';
import './Export-B3PQrADV.js';
import './RemoteTable-Dun11TjL.js';
import './AddFilter-CZ17On64.js';
import './OptionsSelectionList-C9pb9mmD.js';
import './Modal-dMSGxUC4.js';
import './ErrorAlert-BrAljl0x.js';
import './Searchbox-DVYQnN1C.js';
import './create-context-CgHykjw-.js';
import 'driver.js';
import './HTML-1Mhr8hI4.js';
import 'dompurify';
import './html2-FW6Ia4bL.js';

function _page($$payload, $$props) {
  push();
  const Tour = TourData;
  const tourName = features.discoverFeautures.openTour;
  let openTour = void 0;
  if (tourName !== void 0 && tourName in Tour) {
    openTour = Tour[tourName];
  }
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Discover</title>`;
  });
  Content($$payload, {
    full: true,
    children: ($$payload2) => {
      Explorer($$payload2, { tourConfig: openTour });
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-peyXX-8n.js.map
