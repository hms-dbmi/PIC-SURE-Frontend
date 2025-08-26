import { x as push, a1 as head, z as pop, K as escape_html, R as ensure_array_like, P as stringify } from './index-C5NonOVO.js';
import { C as Content } from './Content-DHBbMVB_.js';
import { C as CardButton } from './CardButton-mV7OQcpn.js';
import { b as branding } from './configuration-CSskKBur.js';
import './client2-CLhyDddE.js';
import './exports-Cnt0TmSD.js';

function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(branding.applicationName)} | Help</title>`;
  });
  Content($$payload, {
    title: "Knowledge Hub",
    children: ($$payload2) => {
      const each_array = ensure_array_like(branding?.help?.links);
      $$payload2.out += `<section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8"><!--[-->`;
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let link = each_array[$$index];
        CardButton($$payload2, {
          href: link.url,
          title: link.title,
          subtitle: link.description,
          icon: `${stringify(link.icon)} text-primary-600-400`
        });
      }
      $$payload2.out += `<!--]--></section>`;
    }
  });
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Cteth26J.js.map
