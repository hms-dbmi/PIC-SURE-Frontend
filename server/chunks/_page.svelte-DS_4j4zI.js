import { x as push, a1 as head, z as pop, K as escape_html } from './index-BKfiikQf.js';
import { b as branding, f as features } from './configuration-D-fruRXg.js';
import { C as Content } from './Content-CXUsf3rW.js';
import { E as Explorer, T as TourData } from './TourConfiguration-CN3HRo5H.js';
import './client-HRCS46UK.js';
import './exports-CKriv3vT.js';
import './stores-DhwnhD2d.js';
import './Dictionary-DkgC0mju.js';
import './User-DPh8mmLT.js';
import './index2-CvuFLVuQ.js';
import 'uuid';
import './toaster-DzAsAKEJ.js';
import './index-BB9JrA1L.js';
import './Filter-4LYIgLGB.js';
import './Loading-DKkczq09.js';
import './machine.svelte-D_VZYMjT.js';
import './Export-cYFOztwS.js';
import './RemoteTable-DsZbuyUA.js';
import './AddFilter-BMouBxmg.js';
import './OptionsSelectionList-BuyVKVAm.js';
import './Searchbox-D0oQSAkw.js';
import './ErrorAlert-MgcOEbFF.js';
import 'driver.js';
import './Modal-DVSOHq6m.js';
import './html-FW6Ia4bL.js';

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
//# sourceMappingURL=_page.svelte-DS_4j4zI.js.map
