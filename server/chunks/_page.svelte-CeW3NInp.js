import { c as create_ssr_component, e as escape, v as validate_component, b as each } from './ssr-Di-o4HBA.js';
import { C as Content } from './Content-BUgV6smf.js';
import { C as CardButton } from './CardButton-nEBmTS9Q.js';
import { b as branding } from './configuration-B3dQYR0_.js';
import './lifecycle-GVhEEkqU.js';
import './AngleButton-Cxjzo9QZ.js';
import './client-TAfaRk9z.js';
import './exports-CTha0ECg.js';

const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${$$result.head += `<!-- HEAD_svelte-zl548y_START -->${$$result.title = `<title>${escape(branding.applicationName)} | Help</title>`, ""}<!-- HEAD_svelte-zl548y_END -->`, ""} ${validate_component(Content, "Content").$$render($$result, { title: "Knowledge Hub" }, {}, {
    default: () => {
      return `<section id="info-cards" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">${each(branding?.help?.links, (link) => {
        return `${validate_component(CardButton, "CardButton").$$render(
          $$result,
          {
            "data-testid": "variant-explorer-btn",
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
//# sourceMappingURL=_page.svelte-CeW3NInp.js.map
