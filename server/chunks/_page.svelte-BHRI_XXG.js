import { x as push, a4 as head, z as pop, M as escape_html, S as ensure_array_like, Q as stringify } from './index-BYsoXH7a.js';
import { C as Content } from './Content-D47GFKQW.js';
import { C as CardButton } from './CardButton-BSvkZqlJ.js';
import { b as branding } from './configuration-wjj69jIJ.js';
import './client2-2LGcfZLB.js';
import '@sveltejs/kit/internal';
import './utils-Dn8W3aSK.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Help</title>`;
  });
  Content($$payload, {
    title: "Knowledge Hub",
    children: ($$payload2) => {
      const each_array = ensure_array_like(branding?.help?.links);
      $$payload2.out.push(`<section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8"><!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let link = each_array[$$index];
        CardButton($$payload2, {
          href: link.url,
          title: link.title,
          subtitle: link.description,
          icon: `${stringify(link.icon)} text-primary-600-400`
        });
      }
      $$payload2.out.push(`<!--]--></section>`);
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BHRI_XXG.js.map
