import { x as push, a1 as head, z as pop, K as escape_html } from './index-C5NonOVO.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { f as features, b as branding } from './configuration-CSskKBur.js';
import { E as Explorer, T as TourData } from './TourConfiguration-Djbag161.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';
import './index3-D0mgFMjB.js';
import './client-BWx-wafP.js';
import './Dictionary-10axK71X.js';
import './User-ByrNDeqq.js';
import './index2-CvuFLVuQ.js';
import 'uuid';
import './Filter-BUwQwcV6.js';
import './Loading-Drx6gnkR.js';
import './Export-CTQ_v_3l.js';
import './RemoteTable-Dy4YtKgc.js';
import './AddFilter-BbVq5aRW.js';
import './OptionsSelectionList-Dlogw0gs.js';
import './Searchbox-DzizwK7_.js';
import './ErrorAlert-Sg5STlCJ.js';
import 'dompurify';
import 'driver.js';
import './Modal-tsNejdoN.js';
import './html-FW6Ia4bL.js';

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
//# sourceMappingURL=_page.svelte-BnhjLM3O.js.map
