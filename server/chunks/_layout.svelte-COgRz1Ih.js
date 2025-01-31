import { a as subscribe, h as null_to_empty } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, v as validate_component, e as escape, a as add_attribute } from './ssr-BRJpAXVH.js';
import { u as user } from './User-BiqhXRJx.js';
import './client-BR749xJD.js';
import { T as Toast, F as Footer } from './Footer-B_CmjHP7.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './index2-BVONNh3m.js';
import './index-DzcLzHBX.js';
import './configuration-BRozmRr_.js';
import './stores4-C3NPX6l0.js';
import './exports-kR70XCWV.js';
import './stores2-Cy1ftf_v.js';
import './index4-ClZG_anC.js';
import './stores-CeRLSJyW.js';

const css$1 = {
  code: ".dots-colors.svelte-oyvn9{--primary-circle:rgb(var(--color-primary-500));--secondary-circle:rgb(var(--color-secondary-500));--tertiary-circle:rgb(var(--color-surface-700));--stroke-circle:rgb(var(--color-surface-200))}.five-dots-colors.svelte-oyvn9{--tertiary-circle:rgb(var(--color-tertiary-500));--secondary-circle:rgb(var(--color-secondary-500));--primary-circle:rgb(var(--color-primary-500));--success-circle:rgb(var(--color-success-500));--error-circle:rgb(var(--color-error-500));--stroke-circle:rgb(var(--color-surface-200))}",
  map: '{"version":3,"file":"Dots.svelte","sources":["Dots.svelte"],"sourcesContent":["<script lang=\\"ts\\">let primaryCircle = \\"--color-primary-500\\";\\nlet secondaryCircle = \\"--color-secondary-500\\";\\nlet tertiaryCircle = \\"--color-tertiary-500\\";\\nlet successCircle = \\"\\";\\nlet errorCircle = \\"\\";\\nlet useFiveColors = false;\\nconst dotsColorsClass = (() => {\\n  try {\\n    return JSON.parse(import.meta.env.VITE_DOTS_COLORS_CLASS?.toString()?.toLowerCase()) || [];\\n  } catch (error) {\\n    return [];\\n  }\\n})();\\nswitch (dotsColorsClass.length) {\\n  case 0:\\n    break;\\n  case 3:\\n    primaryCircle = dotsColorsClass[0];\\n    secondaryCircle = dotsColorsClass[1];\\n    tertiaryCircle = dotsColorsClass[2];\\n    break;\\n  case 5:\\n    primaryCircle = dotsColorsClass[0];\\n    secondaryCircle = dotsColorsClass[1];\\n    tertiaryCircle = dotsColorsClass[2];\\n    successCircle = dotsColorsClass[3];\\n    errorCircle = dotsColorsClass[4];\\n    useFiveColors = true;\\n    break;\\n  default:\\n    break;\\n}\\nexport {};\\n<\/script>\\n\\n<svg\\n  class={`${$$props.class ?? \'\'}`}\\n  width=\\"402px\\"\\n  height=\\"373px\\"\\n  viewBox=\\"0 0 402 373\\"\\n  version=\\"1.1\\"\\n  xmlns=\\"http://www.w3.org/2000/svg\\"\\n  xmlns:xlink=\\"http://www.w3.org/1999/xlink\\"\\n>\\n  <title>PIC-SURE Login Lots</title>\\n  <g id=\\"PIC-SURE-lines\\" stroke-width=\\"1\\">\\n    <line x1=\\"16.5\\" y1=\\"36.5\\" x2=\\"46.5\\" y2=\\"89.5\\" id=\\"Line\\" stroke=\\"#C5C7CA\\" stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"30.75\\"\\n      y1=\\"29.75\\"\\n      x2=\\"79.25\\"\\n      y2=\\"43.25\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"46.5\\"\\n      y1=\\"99.5\\"\\n      x2=\\"52.5\\"\\n      y2=\\"174.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"115.5\\"\\n      y1=\\"115.5\\"\\n      x2=\\"55.5\\"\\n      y2=\\"174.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"167.5\\"\\n      y1=\\"131.5\\"\\n      x2=\\"115.5\\"\\n      y2=\\"111.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"157.5\\"\\n      y1=\\"137.5\\"\\n      x2=\\"135.5\\"\\n      y2=\\"221.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"104.5\\"\\n      y1=\\"115.5\\"\\n      x2=\\"137.5\\"\\n      y2=\\"225.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"131.5\\"\\n      y1=\\"221.5\\"\\n      x2=\\"62.5\\"\\n      y2=\\"190.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"127.5\\"\\n      y1=\\"225.5\\"\\n      x2=\\"25.5\\"\\n      y2=\\"261.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"62.5\\"\\n      y1=\\"341.5\\"\\n      x2=\\"25.5\\"\\n      y2=\\"261.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"30.5\\"\\n      y1=\\"261.5\\"\\n      x2=\\"52.5\\"\\n      y2=\\"190.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"97.5\\"\\n      y1=\\"60.5\\"\\n      x2=\\"107.5\\"\\n      y2=\\"99.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#ED462C\\"\\n      stroke-width=\\"0.5\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line x1=\\"97.5\\" y1=\\"60\\" x2=\\"107.5\\" y2=\\"99\\" id=\\"Line\\" stroke=\\"#C5C7CA\\" stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"147.5\\"\\n      y1=\\"16.75\\"\\n      x2=\\"107.5\\"\\n      y2=\\"39.25\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"157.5\\"\\n      y1=\\"110.5\\"\\n      x2=\\"157.5\\"\\n      y2=\\"21.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"277.5\\"\\n      y1=\\"89.5\\"\\n      x2=\\"163.5\\"\\n      y2=\\"119.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"277.5\\"\\n      y1=\\"89.5\\"\\n      x2=\\"146.5\\"\\n      y2=\\"16.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n    <line\\n      x1=\\"386.5\\"\\n      y1=\\"23.5\\"\\n      x2=\\"167.5\\"\\n      y2=\\"16.5\\"\\n      id=\\"Line\\"\\n      stroke=\\"#C5C7CA\\"\\n      stroke-linecap=\\"square\\"\\n    ></line>\\n  </g>\\n  <g id=\\"PIC-SURE-circles\\" stroke-width=\\"1\\">\\n    <circle\\n      id=\\"white-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={`rgb(var(${tertiaryCircle}))`}\\n      cx=\\"17\\"\\n      cy=\\"21\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"white-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={`rgb(var(${tertiaryCircle}))`}\\n      cx=\\"16\\"\\n      cy=\\"261\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"white-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${primaryCircle}))` : `rgb(var(${tertiaryCircle}))`}\\n      cx=\\"109\\"\\n      cy=\\"109\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"secondary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${errorCircle}))` : `rgb(var(${secondaryCircle}))`}\\n      cx=\\"46\\"\\n      cy=\\"94\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"secondary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${primaryCircle}))` : `rgb(var(${secondaryCircle}))`}\\n      cx=\\"285\\"\\n      cy=\\"95\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"secondary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${errorCircle}))` : `rgb(var(${secondaryCircle}))`}\\n      cx=\\"141\\"\\n      cy=\\"230\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"secondary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${secondaryCircle}))` : `rgb(var(${secondaryCircle}))`}\\n      cx=\\"151\\"\\n      cy=\\"16\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"primary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`}\\n      cx=\\"55\\"\\n      cy=\\"190\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"primary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${tertiaryCircle}))` : `rgb(var(${primaryCircle}))`}\\n      cx=\\"65\\"\\n      cy=\\"357\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"primary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${tertiaryCircle}))` : `rgb(var(${primaryCircle}))`}\\n      cx=\\"157\\"\\n      cy=\\"125\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"primary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`}\\n      cx=\\"92\\"\\n      cy=\\"44\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n    <circle\\n      id=\\"primary-circle\\"\\n      stroke=\\"var(--stroke-circle)\\"\\n      fill={useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`}\\n      cx=\\"386\\"\\n      cy=\\"23\\"\\n      r=\\"15.5\\"\\n    ></circle>\\n  </g>\\n</svg>\\n\\n<style>\\n  .dots-colors {\\n    --primary-circle: rgb(var(--color-primary-500));\\n    --secondary-circle: rgb(var(--color-secondary-500));\\n    --tertiary-circle: rgb(var(--color-surface-700));\\n    --stroke-circle: rgb(var(--color-surface-200));\\n  }\\n\\n  .five-dots-colors {\\n    --tertiary-circle: rgb(var(--color-tertiary-500));\\n    --secondary-circle: rgb(var(--color-secondary-500));\\n    --primary-circle: rgb(var(--color-primary-500));\\n    --success-circle: rgb(var(--color-success-500));\\n    --error-circle: rgb(var(--color-error-500));\\n    --stroke-circle: rgb(var(--color-surface-200));\\n  }</style>\\n"],"names":[],"mappings":"AAySE,yBAAa,CACX,gBAAgB,CAAE,6BAA6B,CAC/C,kBAAkB,CAAE,+BAA+B,CACnD,iBAAiB,CAAE,6BAA6B,CAChD,eAAe,CAAE,6BACnB,CAEA,8BAAkB,CAChB,iBAAiB,CAAE,8BAA8B,CACjD,kBAAkB,CAAE,+BAA+B,CACnD,gBAAgB,CAAE,6BAA6B,CAC/C,gBAAgB,CAAE,6BAA6B,CAC/C,cAAc,CAAE,2BAA2B,CAC3C,eAAe,CAAE,6BACnB"}'
};
const Dots = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let primaryCircle = "--color-primary-500";
  let secondaryCircle = "--color-secondary-500";
  let tertiaryCircle = "--color-tertiary-500";
  let successCircle = "";
  let errorCircle = "";
  let useFiveColors = false;
  const dotsColorsClass = (() => {
    try {
      return JSON.parse(void 0) || [];
    } catch (error) {
      return [];
    }
  })();
  switch (dotsColorsClass.length) {
    case 0:
      break;
    case 3:
      primaryCircle = dotsColorsClass[0];
      secondaryCircle = dotsColorsClass[1];
      tertiaryCircle = dotsColorsClass[2];
      break;
    case 5:
      primaryCircle = dotsColorsClass[0];
      secondaryCircle = dotsColorsClass[1];
      tertiaryCircle = dotsColorsClass[2];
      successCircle = dotsColorsClass[3];
      errorCircle = dotsColorsClass[4];
      useFiveColors = true;
      break;
  }
  $$result.css.add(css$1);
  return `<svg class="${escape(null_to_empty(`${$$props.class ?? ""}`), true) + " svelte-oyvn9"}" width="402px" height="373px" viewBox="0 0 402 373" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>PIC-SURE Login Lots</title><g id="PIC-SURE-lines" stroke-width="1"><line x1="16.5" y1="36.5" x2="46.5" y2="89.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="30.75" y1="29.75" x2="79.25" y2="43.25" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="46.5" y1="99.5" x2="52.5" y2="174.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="115.5" y1="115.5" x2="55.5" y2="174.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="167.5" y1="131.5" x2="115.5" y2="111.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="157.5" y1="137.5" x2="135.5" y2="221.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="104.5" y1="115.5" x2="137.5" y2="225.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="131.5" y1="221.5" x2="62.5" y2="190.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="127.5" y1="225.5" x2="25.5" y2="261.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="62.5" y1="341.5" x2="25.5" y2="261.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="30.5" y1="261.5" x2="52.5" y2="190.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="97.5" y1="60.5" x2="107.5" y2="99.5" id="Line" stroke="#ED462C" stroke-width="0.5" stroke-linecap="square"></line><line x1="97.5" y1="60" x2="107.5" y2="99" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="147.5" y1="16.75" x2="107.5" y2="39.25" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="157.5" y1="110.5" x2="157.5" y2="21.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="277.5" y1="89.5" x2="163.5" y2="119.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="277.5" y1="89.5" x2="146.5" y2="16.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="386.5" y1="23.5" x2="167.5" y2="16.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line></g><g id="PIC-SURE-circles" stroke-width="1"><circle id="white-circle" stroke="var(--stroke-circle)"${add_attribute("fill", `rgb(var(${tertiaryCircle}))`, 0)} cx="17" cy="21" r="15.5"></circle><circle id="white-circle" stroke="var(--stroke-circle)"${add_attribute("fill", `rgb(var(${tertiaryCircle}))`, 0)} cx="16" cy="261" r="15.5"></circle><circle id="white-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${primaryCircle}))` : `rgb(var(${tertiaryCircle}))`,
    0
  )} cx="109" cy="109" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${errorCircle}))` : `rgb(var(${secondaryCircle}))`,
    0
  )} cx="46" cy="94" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${primaryCircle}))` : `rgb(var(${secondaryCircle}))`,
    0
  )} cx="285" cy="95" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${errorCircle}))` : `rgb(var(${secondaryCircle}))`,
    0
  )} cx="141" cy="230" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${secondaryCircle}))` : `rgb(var(${secondaryCircle}))`,
    0
  )} cx="151" cy="16" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`,
    0
  )} cx="55" cy="190" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${tertiaryCircle}))` : `rgb(var(${primaryCircle}))`,
    0
  )} cx="65" cy="357" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${tertiaryCircle}))` : `rgb(var(${primaryCircle}))`,
    0
  )} cx="157" cy="125" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`,
    0
  )} cx="92" cy="44" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${add_attribute(
    "fill",
    useFiveColors ? `rgb(var(${successCircle}))` : `rgb(var(${primaryCircle}))`,
    0
  )} cx="386" cy="23" r="15.5"></circle></g></svg>`;
});
const css = {
  code: ".full-height.svelte-1rr6428{height:calc(100% - 56px)}.footer.svelte-1rr6428{position:fixed;bottom:0;width:100%}",
  map: '{"version":3,"file":"+layout.svelte","sources":["+layout.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { user } from \\"$lib/stores/User\\";\\nimport { goto } from \\"$app/navigation\\";\\nimport { onMount } from \\"svelte\\";\\nimport Footer from \\"$lib/components/Footer.svelte\\";\\nimport Dots from \\"$lib/components/Dots.svelte\\";\\nimport { Toast } from \\"@skeletonlabs/skeleton\\";\\nonMount(() => {\\n  if ($user && $user.token) {\\n    goto(\\"/\\");\\n  }\\n});\\n<\/script>\\n\\n<Toast position=\\"t\\" />\\n<div class=\\"w-full full-height\\">\\n  <Dots class=\\"top-dots\\" />\\n  <slot />\\n  <Dots class=\\"bottom-dots\\" />\\n  <div class=\\"footer\\">\\n    <Footer showSitemap={false} />\\n  </div>\\n</div>\\n\\n<style>\\n  .full-height {\\n    height: calc(100% - 56px);\\n  }\\n  .footer {\\n    position: fixed;\\n    bottom: 0;\\n    width: 100%;\\n  }</style>\\n"],"names":[],"mappings":"AAwBE,2BAAa,CACX,MAAM,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,IAAI,CAC1B,CACA,sBAAQ,CACN,QAAQ,CAAE,KAAK,CACf,MAAM,CAAE,CAAC,CACT,KAAK,CAAE,IACT"}'
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_user;
  $$unsubscribe_user = subscribe(user, (value) => value);
  $$result.css.add(css);
  $$unsubscribe_user();
  return `${validate_component(Toast, "Toast").$$render($$result, { position: "t" }, {}, {})} <div class="w-full full-height svelte-1rr6428">${validate_component(Dots, "Dots").$$render($$result, { class: "top-dots" }, {}, {})} ${slots.default ? slots.default({}) : ``} ${validate_component(Dots, "Dots").$$render($$result, { class: "bottom-dots" }, {}, {})} <div class="footer svelte-1rr6428">${validate_component(Footer, "Footer").$$render($$result, { showSitemap: false }, {}, {})}</div> </div>`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-COgRz1Ih.js.map
