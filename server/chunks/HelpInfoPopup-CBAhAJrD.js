import { N as attr, P as stringify, K as escape_html } from './index-C5NonOVO.js';
import { P as Popover } from './Popover-D0sAJhG1.js';

function HelpInfoPopup($$payload, $$props) {
  const { text, id = "", children } = $$props;
  if (text || children) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div${attr("data-testid", id)}>`;
    {
      let trigger = function($$payload2) {
        $$payload2.out += `<i class="fa-solid fa-circle-question text-primary-800-200 hover:text-secondary-800-200"></i>`;
      };
      Popover($$payload, {
        "data-testid": `${stringify(id)}-content`,
        triggerTypes: ["click", "hover"],
        trigger,
        children: ($$payload2) => {
          if (children) {
            $$payload2.out += "<!--[-->";
            children?.($$payload2);
            $$payload2.out += `<!---->`;
          } else if (text) {
            $$payload2.out += "<!--[1-->";
            $$payload2.out += `${escape_html(text)}`;
          } else {
            $$payload2.out += "<!--[!-->";
          }
          $$payload2.out += `<!--]-->`;
        },
        $$slots: { trigger: true, default: true }
      });
    }
    $$payload.out += `<!----></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
}

export { HelpInfoPopup as H };
//# sourceMappingURL=HelpInfoPopup-CBAhAJrD.js.map
