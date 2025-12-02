import { x as push, O as attr, z as pop } from './index-C9dy-hDW.js';
import { b as branding } from './configuration-BAm0JRx1.js';

function _page($$payload, $$props) {
  push();
  $$payload.out.push(`<section class="w-full h-full flex flex-col justify-center items-center"><h3 class="m-0">Something went wrong with your login attempt.</h3> <h3 class="m-0">Please try again!</h3> <p class="m-1">If the problem persists contact an administrator.</p> <div class="flex flex-col justify-between mt-5"><a class="btn preset-filled-primary-500 m-1" href="/login">Back to Login <i class="fa-solid fa-arrow-right ml-3"></i></a> <a class="btn preset-tonal-primary border border-primary-500 m-1" target="_blank"${attr("href", branding.login.contactLink)}>Contact Administrator</a></div></section>`);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CJkE4kWg.js.map
