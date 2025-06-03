import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { f as features, b as branding } from './configuration-Bm4Mu1_g.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { T as TourData, E as Explorer } from './TourConfiguration-Bm8pXif0.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';
import './Dictionary-BYmMUDyk.js';
import './index2-BVONNh3m.js';
import './User-Cv0Sr19m.js';
import './index-CvuFLVuQ.js';
import './Row-Cb2p0o0o.js';
import './Export-lg6T-LMZ.js';
import 'uuid';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './Filter-Bw4yvCKT.js';
import './Searchbox-Dtb4SqsV.js';
import './index3-ClZG_anC.js';
import './ErrorAlert-DgLOjAhF.js';
import './stores-CeRLSJyW.js';
import 'driver.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const Tour = TourData;
  const tourName = features.explorer.authTour;
  let authTour = void 0;
  if (tourName !== void 0 && tourName in Tour) {
    authTour = Tour[tourName];
  }
  return `${$$result.head += `<!-- HEAD_svelte-72bt5e_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Explorer</title>`, ""}<!-- HEAD_svelte-72bt5e_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { full: true }, {}, {
    default: () => {
      return `${validate_component(Explorer, "Explorer").$$render($$result, { tourConfig: authTour }, {}, {})}`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-phCbfPHt.js.map
