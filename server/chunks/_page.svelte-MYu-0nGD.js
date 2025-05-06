import { c as create_ssr_component, e as escape, v as validate_component, b as each } from './ssr-BRJpAXVH.js';
import { C as Content } from './Content-DMwoUi6K.js';
import { C as CardButton } from './CardButton-BunBsA3_.js';
import { b as branding } from './configuration-wvkhv90d.js';
import './lifecycle-DtuISP6h.js';
import './AngleButton-C6YzBYNH.js';
import './client-BR749xJD.js';
import './exports-kR70XCWV.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-zl548y_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Help</title>`, ""}<!-- HEAD_svelte-zl548y_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Knowledge Hub" }, {}, {
    default: () => {
      return `<section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">${each(branding?.help?.links, (link) => {
        return `${validate_component(CardButton, "CardButton").$$render(
          $$result,
          {
            class: "variant-ringed-primary",
            href: link.url,
            title: link.title,
            subtitle: link.description,
            icon: link.icon + " text-primary-500-400-token"
          },
          {},
          {}
        )}`;
      })}</section>`;
    }
  })}`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-MYu-0nGD.js.map
