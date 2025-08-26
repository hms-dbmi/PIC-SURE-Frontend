import { x as push, z as pop, P as stringify, K as escape_html, M as attr_class } from './index-C5NonOVO.js';
import { P as Popover } from './Popover-D0sAJhG1.js';
import { d as debounce } from './Forms-DH01zSCL.js';

function CopyButton($$payload, $$props) {
  push();
  const {
    itemToCopy,
    text = "Copy",
    altText = "Copied!",
    useIcon = false,
    icon = "fa-regular fa-copy",
    altIcon = "fa-regular fa-square-check",
    "data-testid": testid = "",
    class: className = ""
  } = $$props;
  let activeIcon = icon;
  let activeButtonText = text;
  function updateButton() {
    if (useIcon) {
      const iconText = icon;
      debounce(() => activeIcon = iconText, 4500)();
      activeIcon = altIcon;
    } else {
      const btnText = text;
      debounce(() => activeButtonText = btnText, 4500)();
      activeButtonText = altText;
    }
    navigator.clipboard.writeText(itemToCopy);
  }
  {
    let trigger = function($$payload2) {
      if (useIcon) {
        $$payload2.out += "<!--[-->";
        $$payload2.out += `<i${attr_class(`fa-xl ${stringify(activeIcon)}`)}></i>`;
      } else {
        $$payload2.out += "<!--[!-->";
        $$payload2.out += `${escape_html(activeButtonText)}`;
      }
      $$payload2.out += `<!--]-->`;
    };
    Popover($$payload, {
      "data-testid": testid || "copy",
      triggerStyle: `ml-4 ${stringify(useIcon ? "text-black-600 hover:text-primary-600" : "btn")} ${stringify(className)}`,
      onengage: updateButton,
      color: "secondary",
      placement: "bottom",
      trigger,
      children: ($$payload2) => {
        $$payload2.out += `<!---->${escape_html(altText)}`;
      },
      $$slots: { trigger: true, default: true }
    });
  }
  pop();
}

export { CopyButton as C };
//# sourceMappingURL=CopyButton-iVakjEWf.js.map
