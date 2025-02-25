import { a as subscribe } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, e as escape, b as each, a as add_attribute } from './ssr-BRJpAXVH.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import { p as prefersReducedMotionStore } from './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import { f as fly } from './index3-ClZG_anC.js';
import { g as getModalStore } from './stores-CeRLSJyW.js';
import { p as page } from './stores4-C3NPX6l0.js';
import { b as branding } from './configuration-JjhNHhnG.js';
import { u as user } from './User-DpPjP5W7.js';

const cWrapper = "flex fixed top-0 left-0 right-0 bottom-0 pointer-events-none";
const cSnackbar = "flex flex-col gap-y-2";
const cToast = "flex justify-between items-center pointer-events-auto";
const cToastActions = "flex items-center space-x-2";
const Toast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let classesWrapper;
  let classesSnackbar;
  let classesToast;
  let filteredToasts;
  let $toastStore, $$unsubscribe_toastStore;
  let $prefersReducedMotionStore, $$unsubscribe_prefersReducedMotionStore;
  $$unsubscribe_prefersReducedMotionStore = subscribe(prefersReducedMotionStore, (value) => $prefersReducedMotionStore = value);
  const toastStore = getToastStore();
  $$unsubscribe_toastStore = subscribe(toastStore, (value) => $toastStore = value);
  let { position = "b" } = $$props;
  let { max = 3 } = $$props;
  let { background = "variant-filled-secondary" } = $$props;
  let { width = "max-w-[640px]" } = $$props;
  let { color = "" } = $$props;
  let { padding = "p-4" } = $$props;
  let { spacing = "space-x-4" } = $$props;
  let { rounded = "rounded-container-token" } = $$props;
  let { shadow = "shadow-lg" } = $$props;
  let { zIndex = "z-[888]" } = $$props;
  let { buttonAction = "btn variant-filled" } = $$props;
  let { buttonDismiss = "btn-icon btn-icon-sm variant-filled" } = $$props;
  let { buttonDismissLabel = "✕" } = $$props;
  let { transitions = !$prefersReducedMotionStore } = $$props;
  let { transitionIn = fly } = $$props;
  let { transitionInParams = { duration: 250 } } = $$props;
  let { transitionOut = fly } = $$props;
  let { transitionOutParams = { duration: 250 } } = $$props;
  let cPosition;
  let cAlign;
  switch (position) {
    case "t":
      cPosition = "justify-center items-start";
      cAlign = "items-center";
      break;
    case "b":
      cPosition = "justify-center items-end";
      cAlign = "items-center";
      break;
    case "l":
      cPosition = "justify-start items-center";
      cAlign = "items-start";
      break;
    case "r":
      cPosition = "justify-end items-center";
      cAlign = "items-end";
      break;
    case "tl":
      cPosition = "justify-start items-start";
      cAlign = "items-start";
      break;
    case "tr":
      cPosition = "justify-end items-start";
      cAlign = "items-end";
      break;
    case "bl":
      cPosition = "justify-start items-end";
      cAlign = "items-start";
      break;
    case "br":
      cPosition = "justify-end items-end";
      cAlign = "items-end";
      break;
  }
  let wrapperVisible = false;
  if ($$props.position === void 0 && $$bindings.position && position !== void 0) $$bindings.position(position);
  if ($$props.max === void 0 && $$bindings.max && max !== void 0) $$bindings.max(max);
  if ($$props.background === void 0 && $$bindings.background && background !== void 0) $$bindings.background(background);
  if ($$props.width === void 0 && $$bindings.width && width !== void 0) $$bindings.width(width);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.padding === void 0 && $$bindings.padding && padding !== void 0) $$bindings.padding(padding);
  if ($$props.spacing === void 0 && $$bindings.spacing && spacing !== void 0) $$bindings.spacing(spacing);
  if ($$props.rounded === void 0 && $$bindings.rounded && rounded !== void 0) $$bindings.rounded(rounded);
  if ($$props.shadow === void 0 && $$bindings.shadow && shadow !== void 0) $$bindings.shadow(shadow);
  if ($$props.zIndex === void 0 && $$bindings.zIndex && zIndex !== void 0) $$bindings.zIndex(zIndex);
  if ($$props.buttonAction === void 0 && $$bindings.buttonAction && buttonAction !== void 0) $$bindings.buttonAction(buttonAction);
  if ($$props.buttonDismiss === void 0 && $$bindings.buttonDismiss && buttonDismiss !== void 0) $$bindings.buttonDismiss(buttonDismiss);
  if ($$props.buttonDismissLabel === void 0 && $$bindings.buttonDismissLabel && buttonDismissLabel !== void 0) $$bindings.buttonDismissLabel(buttonDismissLabel);
  if ($$props.transitions === void 0 && $$bindings.transitions && transitions !== void 0) $$bindings.transitions(transitions);
  if ($$props.transitionIn === void 0 && $$bindings.transitionIn && transitionIn !== void 0) $$bindings.transitionIn(transitionIn);
  if ($$props.transitionInParams === void 0 && $$bindings.transitionInParams && transitionInParams !== void 0) $$bindings.transitionInParams(transitionInParams);
  if ($$props.transitionOut === void 0 && $$bindings.transitionOut && transitionOut !== void 0) $$bindings.transitionOut(transitionOut);
  if ($$props.transitionOutParams === void 0 && $$bindings.transitionOutParams && transitionOutParams !== void 0) $$bindings.transitionOutParams(transitionOutParams);
  classesWrapper = `${cWrapper} ${cPosition} ${zIndex} ${$$props.class || ""}`;
  classesSnackbar = `${cSnackbar} ${cAlign} ${padding}`;
  classesToast = `${cToast} ${width} ${color} ${padding} ${spacing} ${rounded} ${shadow}`;
  filteredToasts = Array.from($toastStore).slice(0, max);
  {
    if (filteredToasts.length) {
      wrapperVisible = true;
    }
  }
  $$unsubscribe_toastStore();
  $$unsubscribe_prefersReducedMotionStore();
  return `${filteredToasts.length > 0 || wrapperVisible ? ` <div class="${"snackbar-wrapper " + escape(classesWrapper, true)}" data-testid="snackbar-wrapper"> <div class="${"snackbar " + escape(classesSnackbar, true)}">${each(filteredToasts, (t, i) => {
    return `<div${add_attribute("role", t.hideDismiss ? "alert" : "alertdialog", 0)} aria-live="polite"> <div class="${"toast " + escape(classesToast, true) + " " + escape(t.background ?? background, true) + " " + escape(t.classes ?? "", true)}" data-testid="toast"><div class="text-base"><!-- HTML_TAG_START -->${t.message}<!-- HTML_TAG_END --></div> ${t.action || !t.hideDismiss ? `<div class="${"toast-actions " + escape(cToastActions, true)}">${t.action ? `<button${add_attribute("class", buttonAction, 0)}><!-- HTML_TAG_START -->${t.action.label}<!-- HTML_TAG_END --></button>` : ``} ${!t.hideDismiss ? `<button${add_attribute("class", buttonDismiss, 0)} aria-label="Dismiss toast">${escape(buttonDismissLabel)}</button>` : ``} </div>` : ``}</div> </div>`;
  })}</div></div>` : ``}`;
});
const css = {
  code: "#sitemap-footer.svelte-1wqpxe6.svelte-1wqpxe6{padding:0.5em 0 0;margin:0 auto;text-align:center;padding:1em 15%}#sitemap-footer.svelte-1wqpxe6 ul.svelte-1wqpxe6{text-align:left;margin:0 2em}",
  map: `{"version":3,"file":"Footer.svelte","sources":["Footer.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { getModalStore } from \\"@skeletonlabs/skeleton\\";\\nconst modalStore = getModalStore();\\nimport { page } from \\"$app/stores\\";\\nimport { branding, features } from \\"$lib/configuration\\";\\nimport { user } from \\"$lib/stores/User\\";\\nimport TermsModal from \\"$lib/components/modals/TermsModal.svelte\\";\\nexport let showSitemap = branding?.footer?.showSitemap || false;\\n$: hideSitemap = !showSitemap || branding?.footer?.excludeSitemapOn?.find((hide) => $page.url.pathname.includes(hide));\\n$: sitemap = branding?.sitemap?.map((section) => ({\\n  ...section,\\n  show: !section.privilege || $user.privileges && $user.privileges.includes(section.privilege)\\n}));\\nfunction openTermsModal() {\\n  modalStore.trigger({\\n    type: \\"component\\",\\n    component: \\"modalWrapper\\",\\n    meta: { component: TermsModal, width: \\"w-3/4\\" }\\n  });\\n}\\n<\/script>\\n\\n{#if !hideSitemap && branding?.sitemap?.length > 0}\\n  <div id=\\"sitemap-footer\\">\\n    <div class=\\"flex flex-wrap place-content-center\\">\\n      {#each sitemap as section}\\n        {#if section.show}\\n          <ul class=\\"basis-1/8\\">\\n            <li class=\\"font-bold text-center\\">{section.category}</li>\\n            {#each section.links as link}\\n              <li class=\\"text-center\\">\\n                <a target={link.newTab ? '_blank' : '_self'} href={link.url} class=\\"hover:underline\\"\\n                  >{link.title}</a\\n                >\\n              </li>\\n            {/each}\\n          </ul>\\n        {/if}\\n      {/each}\\n    </div>\\n  </div>\\n{/if}\\n<footer id=\\"main-footer\\" class=\\"flex relative\\">\\n  <ul>\\n    {#if features.termsOfService}\\n      <li>\\n        <button class=\\"hover:underline text-xs\\" on:click={openTermsModal}>Terms of Service</button>\\n      </li>\\n    {/if}\\n    {#each branding?.footer?.links as link}\\n      <li>\\n        <a class=\\"hover:underline text-xs\\" target={link.newTab ? '_blank' : '_self'} href={link.url}\\n          >{link.title}</a\\n        >\\n      </li>\\n    {/each}\\n  </ul>\\n</footer>\\n\\n<style lang=\\"postcss\\">\\n  #sitemap-footer {\\n    padding: 0.5em 0 0;\\n    margin: 0 auto;\\n    text-align: center;\\n    padding: 1em 15%;\\n  }\\n  #sitemap-footer ul {\\n    text-align: left;\\n    margin: 0 2em;\\n  }</style>\\n"],"names":[],"mappings":"AA2DE,6CAAgB,CACd,OAAO,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAClB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,GAAG,CAAC,GACf,CACA,8BAAe,CAAC,iBAAG,CACjB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,CAAC,CAAC,GACZ"}`
};
const Footer = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let hideSitemap;
  let sitemap;
  let $user, $$unsubscribe_user;
  let $page, $$unsubscribe_page;
  $$unsubscribe_user = subscribe(user, (value) => $user = value);
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  getModalStore();
  let { showSitemap = branding?.footer?.showSitemap || false } = $$props;
  if ($$props.showSitemap === void 0 && $$bindings.showSitemap && showSitemap !== void 0) $$bindings.showSitemap(showSitemap);
  $$result.css.add(css);
  hideSitemap = !showSitemap || branding?.footer?.excludeSitemapOn?.find((hide) => $page.url.pathname.includes(hide));
  sitemap = branding?.sitemap?.map((section) => ({
    ...section,
    show: !section.privilege || $user.privileges && $user.privileges.includes(section.privilege)
  }));
  $$unsubscribe_user();
  $$unsubscribe_page();
  return `${!hideSitemap && branding?.sitemap?.length > 0 ? `<div id="sitemap-footer" class="svelte-1wqpxe6"><div class="flex flex-wrap place-content-center">${each(sitemap, (section) => {
    return `${section.show ? `<ul class="basis-1/8 svelte-1wqpxe6"><li class="font-bold text-center">${escape(section.category)}</li> ${each(section.links, (link) => {
      return `<li class="text-center"><a${add_attribute("target", link.newTab ? "_blank" : "_self", 0)}${add_attribute("href", link.url, 0)} class="hover:underline">${escape(link.title)}</a> </li>`;
    })} </ul>` : ``}`;
  })}</div></div>` : ``} <footer id="main-footer" class="flex relative"><ul>${``} ${each(branding?.footer?.links, (link) => {
    return `<li><a class="hover:underline text-xs"${add_attribute("target", link.newTab ? "_blank" : "_self", 0)}${add_attribute("href", link.url, 0)}>${escape(link.title)}</a> </li>`;
  })}</ul> </footer>`;
});

export { Footer as F, Toast as T };
//# sourceMappingURL=Footer-CLo78LTK.js.map
