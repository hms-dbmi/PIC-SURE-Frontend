import { c as create_ssr_component, a as add_attribute } from './ssr-Di-o4HBA.js';
import { b as branding } from './configuration-CHJZnZTS.js';
import './lifecycle-GVhEEkqU.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<section class="w-full h-full flex flex-col justify-center items-center" data-svelte-h="svelte-1iwuacw"><h3 class="m-0">Something went wrong with your login attempt.</h3> <h3 class="m-0">Please try again!</h3> <p class="m-1">If the problem persists contact an administrator.</p> <div class="flex flex-col justify-between mt-5"><a class="btn variant-filled-primary m-1" href="/login">Back to Login <i class="fa-solid fa-arrow-right ml-3"></i></a> <a class="btn variant-ghost-primary m-1" target="_blank"${add_attribute("href", branding.login.contactLink, 0)}>Contact Administrator</a></div></section>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-Tct9XvLy.js.map
