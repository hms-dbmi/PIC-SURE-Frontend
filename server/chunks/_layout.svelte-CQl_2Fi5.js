import { c as create_ssr_component, e as escape, v as validate_component, a as add_attribute } from './ssr-Di-o4HBA.js';
import { i as initializeModalStore } from './stores-Bn6ceQfl.js';
import { i as initializeToastStore } from './stores2-DrFt-twL.js';
import { w as writable } from './index2-CV6P_ZFI.js';
import { s as setContext, a as subscribe } from './lifecycle-GVhEEkqU.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { i as initializeBranding, s as settings, b as branding } from './configuration-CHJZnZTS.js';
import { gtag } from 'gtagjs';
import { B as BROWSER } from './prod-ssr-DxkyU4_t.js';
import { p as page } from './stores3-DsZ2QG0u.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';

const browser = BROWSER;
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
const GoogleTracking = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let googleConsentVisible;
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let googleTag = settings.google.tagManager;
  let googleAnalyticsID = settings.google.analytics;
  googleConsentVisible = false;
  {
    {
      if (googleAnalyticsID && browser && typeof gtag === "function" && localStorage.getItem("consentMode")?.includes("granted")) {
        gtag("js", /* @__PURE__ */ new Date());
        gtag("config", googleAnalyticsID, {
          page_title: document.title,
          page_path: $page.url.pathname
        });
      }
    }
  }
  $$unsubscribe_page();
  return `${$$result.head += `<!-- HEAD_svelte-1wk68kl_START -->${googleAnalyticsID ? `<script async src="${"https://www.googletagmanager.com/gtag/js?id=" + escape(googleAnalyticsID, true)}"><\/script> <script${add_attribute("data-analyticsid", googleAnalyticsID, 0)}>let googleAnalyticsID = document.currentScript.getAttribute('data-analyticsID');
      window.dataLayer = window.dataLayer || [];

      function gtag() {
        dataLayer.push(arguments);
      }

      gtag('js', new Date());
      gtag('config', googleAnalyticsID);

      gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        personalization_storage: 'denied',
        ad_personalization: 'denied',
        ad_data: 'denied',
        ad_user_data: 'denied',
      });

      let consents = localStorage.getItem('consentMode');
      if (consents) {
        consents = JSON.parse(consents);
        gtag('consent', 'update', consents);
      }<\/script>` : ``}${googleTag ? `<script${add_attribute("data-googletag", googleTag, 0)}>let googleTag = document.currentScript.getAttribute('data-googleTag');

      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', googleTag);<\/script>` : ``}<!-- HEAD_svelte-1wk68kl_END -->`, ""} ${googleTag && googleConsentVisible && branding?.privacyPolicy?.url && branding?.privacyPolicy?.title ? `<div data-testid="consentModal" class="fixed" style="left: 5%; bottom: 60px; z-index: 1000; width: 90%"><div class="bg-surface-50-900-token p-4 rounded-container-token shadow-2xl"><div class="flex flex-row justify-between items-center"><div class="flex items center"><p>We use cookies to provide you with the best possible experience and to help us make the
            site more useful to visitors. To learn more, please visit our <a${add_attribute("href", branding?.privacyPolicy?.url, 0)} target="_blank" class="anchor">${escape(branding?.privacyPolicy?.title)}</a>.</p></div> <div class="flex flex-col justify-center"><button data-testid="acceptGoogleConsent" class="btn variant-filled-primary mt-1 mb-1" data-svelte-h="svelte-7hf92q">Accept</button> <button data-testid="rejectGoogleConsent" class="btn variant-ghost-primary mt-1 mb-1 self-center" data-svelte-h="svelte-1rjwrh0">Reject</button></div></div></div></div>` : ``}`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let googleTag = settings.google.tagManager;
  initializeStores();
  initializeBranding();
  return ` ${googleTag ? `<noscript><iframe src="${"https://www.googletagmanager.com/ns.html?id=" + escape(googleTag, true)}" title="googleTagManger" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript> ` : ``} <main class="w-full h-full">${slots.default ? slots.default({}) : ``} ${validate_component(GoogleTracking, "GoogleTracking").$$render($$result, {}, {}, {})}</main>`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-CQl_2Fi5.js.map
