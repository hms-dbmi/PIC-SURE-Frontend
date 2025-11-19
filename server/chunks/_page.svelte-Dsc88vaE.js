import { x as push, a8 as head, z as pop, M as escape_html, S as ensure_array_like, Q as stringify } from './index-DMPVr6nO.js';
import { C as Content } from './Content-DMJk6TmZ.js';
import { C as CardButton } from './CardButton-Dfic0Ypg.js';
import { b as branding } from './configuration-CBIXsjx2.js';
import './client2-DxcZr6Tp.js';
import '@sveltejs/kit/internal';
import './utils-B7NzVBxP.js';

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
//# sourceMappingURL=_page.svelte-Dsc88vaE.js.map
