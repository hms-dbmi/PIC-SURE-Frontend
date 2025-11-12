import { x as push, O as attr, z as pop, Q as stringify, N as attr_class } from './index-BYsoXH7a.js';
import { P as Popover } from './Popover-Bb0SyMGZ.js';
import { s as sanitizeHTML } from './HTML-1Mhr8hI4.js';
import { h as html } from './html2-FW6Ia4bL.js';

function HelpInfoPopup($$payload, $$props) {
  push();
  const {
    text,
    id = "",
    type = "question",
    color = "primary",
    size = "",
    popoverSize = "",
    children
  } = $$props;
  if (text || children) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div${attr("data-testid", id)}>`);
    {
      let trigger = function($$payload2) {
        $$payload2.out.push(`<i${attr_class(`fa-solid fa-circle-${stringify(type)} text-${stringify(color)}-950-50 hover:text-${stringify(color)}-300-700 ${stringify(size)}`)}></i>`);
      };
      Popover($$payload, {
        "data-testid": `${stringify(id)}-content`,
        triggerTypes: ["click", "hover"],
        size: popoverSize,
        trigger,
        children: ($$payload2) => {
          if (children) {
            $$payload2.out.push("<!--[-->");
            children?.($$payload2);
            $$payload2.out.push(`<!---->`);
          } else {
            $$payload2.out.push("<!--[!-->");
            if (text) {
              $$payload2.out.push("<!--[-->");
              $$payload2.out.push(`${html(sanitizeHTML(text))}`);
            } else {
              $$payload2.out.push("<!--[!-->");
            }
            $$payload2.out.push(`<!--]-->`);
          }
          $$payload2.out.push(`<!--]-->`);
        },
        $$slots: { trigger: true, default: true }
      });
    }
    $$payload.out.push(`<!----></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}

export { HelpInfoPopup as H };
//# sourceMappingURL=HelpInfoPopup-DgfCX4zR.js.map
