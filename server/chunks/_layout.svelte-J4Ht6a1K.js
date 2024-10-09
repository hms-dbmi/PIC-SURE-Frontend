import { c as create_ssr_component, e as escape, v as validate_component, s as setContext, a as add_attribute } from './ssr-C099ZcAV.js';
import { i as initializeModalStore } from './stores-BqdKqnkB.js';
import { i as initializeToastStore } from './stores2-DM9tzbse.js';
import { w as writable } from './index2-Bx7ZSImw.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { i as initializeBranding, b as branding, s as settings } from './configuration-5_HU3Jec.js';
import { s as subscribe } from './utils-EiTRXYbg.js';
import { p as page } from './stores3-BdNELvYD.js';
import { gtag } from 'gtagjs';
import { b as browser } from './index3-C8Afr38c.js';
import './client-DpIAX_q0.js';
import './exports-BGi7-Rnc.js';
import './prod-ssr-DxkyU4_t.js';

const DRAWER_STORE_KEY = "drawerStore";
function initializeDrawerStore() {
  const drawerStore = drawerService();
  return setContext(DRAWER_STORE_KEY, drawerStore);
}
function drawerService() {
  const { subscribe: subscribe2, set, update } = writable({});
  return {
    subscribe: subscribe2,
    set,
    update,
    /** Open the drawer. */
    open: (newSettings) => update(() => {
      return { open: true, ...newSettings };
    }),
    /** Close the drawer. */
    close: () => update((d) => {
      d.open = false;
      return d;
    })
  };
}
function initializeStores() {
  initializeModalStore();
  initializeToastStore();
  initializeDrawerStore();
}
const GoogleAnalytics = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let googleAnalyticsID = settings.google.analytics;
  {
    {
      if (googleAnalyticsID && browser && typeof gtag === "function" && localStorage.getItem("consentMode")?.includes("granted")) {
        console.debug("Tracking page view with Google Analytics");
        gtag("config", googleAnalyticsID, {
          page_title: document.title,
          page_path: $page.url.pathname
        });
      }
    }
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-1tdkvs6_START -->${googleAnalyticsID ? `<script async src="${"https://www.googletagmanager.com/gtag/js?id=" + escape(googleAnalyticsID, true)}"><\/script>` : ``}<!-- HEAD_svelte-1tdkvs6_END -->`, ""}`;
});
const GoogleConsents = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let googleConsentVisible;
  let googleTag = settings.google.tagManager;
  googleConsentVisible = false;
  return `${googleTag && googleConsentVisible && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title ? `<div data-testid="consentModal" class="fixed" style="left: 5%; bottom: 60px; z-index: 1000; width: 90%"><div class="bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"><div class="flex flex-row justify-between items-center"><div class="flex items center"><p>We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our <a${add_attribute("href", branding?.privacyPolicy?.url, 0)} target="_blank" class="anchor">${escape(branding?.privacyPolicy?.title)}</a>.</p></div> <div class="flex flex-col justify-center"><button data-testid="acceptGoogleConsent" class="btn variant-filled-primary mt-1 mb-1" data-svelte-h="svelte-7hf92q">Accept</button> <button data-testid="rejectGoogleConsent" class="btn variant-ghost-primary mt-1 mb-1 self-center" data-svelte-h="svelte-1rjwrh0">Reject</button></div></div></div></div>` : ``}`;
});
const GoogleTagManger = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let googleTagManagerId = settings.google.tagManager;
  initializeStores();
  initializeBranding();
  return `<main class="w-full h-full"> <noscript><iframe title="googleTagManager" src="${"https://www.googletagmanager.com/ns.html?id=" + escape(googleTagManagerId, true)}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>  ${slots.default ? slots.default({}) : ``} ${validate_component(GoogleConsents, "GoogleConsents").$$render($$result, {}, {}, {})}</main> ${validate_component(GoogleAnalytics, "GoogleAnalytics").$$render($$result, {}, {}, {})} ${validate_component(GoogleTagManger, "GoogleTagManger").$$render($$result, {}, {}, {})}`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-J4Ht6a1K.js.map
