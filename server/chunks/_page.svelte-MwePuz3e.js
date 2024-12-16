import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-D53qfAxy.js';
import { f as features, b as branding } from './configuration-zUcJ0Kpb.js';
import { T as TourData, E as Explorer } from './TourConfiguration-DPmnfXGT.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';
import './index2-BVONNh3m.js';
import './Row-DZ3u2TX9.js';
import './stores4-B2YFsTYy.js';
import './Search-Bp0u75kz.js';
import './dictionary-BCWDtCUQ.js';
import './User-Dh89vg_C.js';
import './index-CvuFLVuQ.js';
import './Export-Bnz6Pnjy.js';
import 'uuid';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './Filter-DDQi75i9.js';
import './Searchbox-BoG8iIe-.js';
import './index3-ClZG_anC.js';
import './stores-CeRLSJyW.js';
import 'driver.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const Tour = TourData;
  const tourName = features.discoverFeautures.openTour;
  let openTour = void 0;
  if (tourName !== void 0 && tourName in Tour) {
    openTour = Tour[tourName];
  }
  return `${$$result.head += `<!-- HEAD_svelte-uhn8uu_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Discover</title>`, ""}<!-- HEAD_svelte-uhn8uu_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { full: true }, {}, {
    default: () => {
      return `${validate_component(Explorer, "Explorer").$$render($$result, { tourConfig: openTour }, {}, {})}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-MwePuz3e.js.map
