import { s as subscribe } from './utils-EiTRXYbg.js';
import { c as create_ssr_component, b as each, e as escape, a as add_attribute } from './ssr-C099ZcAV.js';
import { g as getModalStore } from './stores-BqdKqnkB.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import { p as page } from './stores3-BdNELvYD.js';
import { b as branding } from './configuration-5_HU3Jec.js';
import { u as user } from './User-D2U6RL_p.js';

const css = {
  code: "#sitemap-footer.svelte-1wqpxe6.svelte-1wqpxe6{padding:0.5em 0 0;margin:0 auto;text-align:center;padding:1em 15%}#sitemap-footer.svelte-1wqpxe6 ul.svelte-1wqpxe6{text-align:left;margin:0 2em}",
  map: `{"version":3,"file":"Footer.svelte","sources":["Footer.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { getModalStore } from \\"@skeletonlabs/skeleton\\";\\nconst modalStore = getModalStore();\\nimport { page } from \\"$app/stores\\";\\nimport { branding } from \\"$lib/configuration\\";\\nimport { user } from \\"$lib/stores/User\\";\\nimport TermsModal from \\"$lib/components/TermsModal.svelte\\";\\nexport let showSitemap = branding?.footer?.showSitemap || false;\\n$: hideSitemap = !showSitemap || branding?.footer?.excludeSitemapOn?.find((hide) => $page.url.pathname.includes(hide));\\n$: sitemap = branding?.sitemap?.map((section) => ({\\n  ...section,\\n  show: !section.privilege || $user.privileges && $user.privileges.includes(section.privilege)\\n}));\\nfunction openTermsModal() {\\n  modalStore.trigger({\\n    type: \\"component\\",\\n    component: \\"modalWrapper\\",\\n    meta: { component: TermsModal, width: \\"w-3/4\\" }\\n  });\\n}\\n<\/script>\\n\\n{#if !hideSitemap && branding?.sitemap?.length > 0}\\n  <div id=\\"sitemap-footer\\">\\n    <div class=\\"flex flex-wrap place-content-center\\">\\n      {#each sitemap as section}\\n        {#if section.show}\\n          <ul class=\\"basis-1/8\\">\\n            <li class=\\"font-bold text-center\\">{section.category}</li>\\n            {#each section.links as link}\\n              <li class=\\"text-center\\">\\n                <a target={link.newTab ? '_blank' : '_self'} href={link.url} class=\\"hover:underline\\"\\n                  >{link.title}</a\\n                >\\n              </li>\\n            {/each}\\n          </ul>\\n        {/if}\\n      {/each}\\n    </div>\\n  </div>\\n{/if}\\n<footer id=\\"main-footer\\" class=\\"flex relative\\">\\n  <ul>\\n    {#if branding?.footer?.showTerms}\\n      <li><button class=\\"hover:underline\\" on:click={openTermsModal}>Terms of Service</button></li>\\n    {/if}\\n    {#each branding?.footer?.links as link}\\n      <li>\\n        <a class=\\"hover:underline text-xs\\" target={link.newTab ? '_blank' : '_self'} href={link.url}\\n          >{link.title}</a\\n        >\\n      </li>\\n    {/each}\\n  </ul>\\n</footer>\\n\\n<style lang=\\"postcss\\">\\n  #sitemap-footer {\\n    padding: 0.5em 0 0;\\n    margin: 0 auto;\\n    text-align: center;\\n    padding: 1em 15%;\\n  }\\n  #sitemap-footer ul {\\n    text-align: left;\\n    margin: 0 2em;\\n  }</style>\\n"],"names":[],"mappings":"AAyDE,6CAAgB,CACd,OAAO,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAClB,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,MAAM,CAClB,OAAO,CAAE,GAAG,CAAC,GACf,CACA,8BAAe,CAAC,iBAAG,CACjB,UAAU,CAAE,IAAI,CAChB,MAAM,CAAE,CAAC,CAAC,GACZ"}`
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
  })}</div></div>` : ``} <footer id="main-footer" class="flex relative"><ul>${branding?.footer?.showTerms ? `<li><button class="hover:underline" data-svelte-h="svelte-lfxvkk">Terms of Service</button></li>` : ``} ${each(branding?.footer?.links, (link) => {
    return `<li><a class="hover:underline text-xs"${add_attribute("target", link.newTab ? "_blank" : "_self", 0)}${add_attribute("href", link.url, 0)}>${escape(link.title)}</a> </li>`;
  })}</ul> </footer>`;
});

export { Footer as F };
//# sourceMappingURL=Footer-C4fXLTzR.js.map
