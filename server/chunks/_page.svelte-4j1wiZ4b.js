import { c as create_ssr_component, e as escape, v as validate_component } from './ssr-BRJpAXVH.js';
import { f as features, b as branding } from './configuration-CJ60Yp9o.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { T as TourData, E as Explorer } from './TourConfiguration-CoNYPg_r.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';
import './stores4-C3NPX6l0.js';
import './Dictionary-BfHinM5z.js';
import './index2-BVONNh3m.js';
import './User-DLjB6rDR.js';
import './index-DzcLzHBX.js';
import './Row-Cb2p0o0o.js';
import './Export-lg6T-LMZ.js';
import 'uuid';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './ProgressRadial-STSdW-aK.js';
import './Filter-C4oAigXk.js';
import './Searchbox-Dtb4SqsV.js';
import './index4-ClZG_anC.js';
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
//# sourceMappingURL=_page.svelte-4j1wiZ4b.js.map
