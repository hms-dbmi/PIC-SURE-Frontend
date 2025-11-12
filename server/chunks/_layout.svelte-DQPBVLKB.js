import { x as push, z as pop, N as attr_class, O as attr, P as clsx, Q as stringify } from './index-BYsoXH7a.js';
import { T as Toaster, F as Footer } from './Footer-wN4pgPuX.js';
import { t as toaster } from './User-CGCqDR6a.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';
import './client2-2LGcfZLB.js';
import './Loading-D4A6B7i5.js';
import './index2-DXnmzf54.js';
import './configuration-wjj69jIJ.js';
import '@sveltejs/kit';
import './HTML-1Mhr8hI4.js';
import 'dompurify';
import './html2-FW6Ia4bL.js';
import './Modal-CHSSe0AJ.js';

function Dots($$payload, $$props) {
  push();
  let { class: className = "" } = $$props;
  let primaryCircle = "--color-primary-500";
  let secondaryCircle = "--color-secondary-500";
  let tertiaryCircle = "--color-tertiary-500";
  let successCircle = "--color-success-500";
  let errorCircle = "--color-error-500";
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
  $$payload.out.push(`<svg${attr_class(clsx(className))} width="402px" height="373px" viewBox="0 0 402 373" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>PIC-SURE Login Lots</title><g id="PIC-SURE-lines" stroke-width="1"><line x1="16.5" y1="36.5" x2="46.5" y2="89.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="30.75" y1="29.75" x2="79.25" y2="43.25" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="46.5" y1="99.5" x2="52.5" y2="174.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="115.5" y1="115.5" x2="55.5" y2="174.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="167.5" y1="131.5" x2="115.5" y2="111.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="157.5" y1="137.5" x2="135.5" y2="221.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="104.5" y1="115.5" x2="137.5" y2="225.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="131.5" y1="221.5" x2="62.5" y2="190.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="127.5" y1="225.5" x2="25.5" y2="261.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="62.5" y1="341.5" x2="25.5" y2="261.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="30.5" y1="261.5" x2="52.5" y2="190.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="97.5" y1="60.5" x2="107.5" y2="99.5" id="Line" stroke="#ED462C" stroke-width="0.5" stroke-linecap="square"></line><line x1="97.5" y1="60" x2="107.5" y2="99" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="147.5" y1="16.75" x2="107.5" y2="39.25" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="157.5" y1="110.5" x2="157.5" y2="21.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="277.5" y1="89.5" x2="163.5" y2="119.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="277.5" y1="89.5" x2="146.5" y2="16.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line><line x1="386.5" y1="23.5" x2="167.5" y2="16.5" id="Line" stroke="#C5C7CA" stroke-linecap="square"></line></g><g id="PIC-SURE-circles" stroke-width="1"><circle id="white-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(tertiaryCircle)})`)} cx="17" cy="21" r="15.5"></circle><circle id="white-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(tertiaryCircle)})`)} cx="16" cy="261" r="15.5"></circle><circle id="white-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? primaryCircle : tertiaryCircle)})`)} cx="109" cy="109" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? errorCircle : secondaryCircle)})`)} cx="46" cy="94" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? primaryCircle : secondaryCircle)})`)} cx="285" cy="95" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? errorCircle : secondaryCircle)})`)} cx="141" cy="230" r="15.5"></circle><circle id="secondary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(secondaryCircle)})`)} cx="151" cy="16" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? successCircle : primaryCircle)})`)} cx="55" cy="190" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? tertiaryCircle : primaryCircle)})`)} cx="65" cy="357" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? tertiaryCircle : primaryCircle)})`)} cx="157" cy="125" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? successCircle : primaryCircle)})`)} cx="92" cy="44" r="15.5"></circle><circle id="primary-circle" stroke="var(--stroke-circle)"${attr("fill", `var(${stringify(useFiveColors ? successCircle : primaryCircle)})`)} cx="386" cy="23" r="15.5"></circle></g></svg>`);
  pop();
}
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  Toaster($$payload, { toaster });
  $$payload.out.push(`<!----> <div class="w-full full-height svelte-v5v6zp">`);
  Dots($$payload, { class: "top-dots" });
  $$payload.out.push(`<!----> <div class="alert-banner svelte-v5v6zp"><p>Because of a lapse in government funding, the information on this website may not be up to date,
      transactions submitted via the website may not be processed, and the agency may not be able to
      respond to inquiries until appropriations are enacted. The NIH Clinical Center (the research
      hospital of NIH) is open. For more details about its operating status, please visit <a href="http://cc.nih.gov/" class="anchor" target="_blank" rel="noopener noreferrer">cc.nih.gov.</a> Updates regarding government operating status and resumption of normal operations can be found at <a href="http://opm.gov/" class="anchor" target="_blank" rel="noopener noreferrer">opm.gov.</a></p></div> `);
  children?.($$payload);
  $$payload.out.push(`<!----> `);
  Dots($$payload, { class: "bottom-dots" });
  $$payload.out.push(`<!----> <div class="footer svelte-v5v6zp">`);
  Footer($$payload, { showSitemap: false });
  $$payload.out.push(`<!----></div></div>`);
  pop();
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-DQPBVLKB.js.map
