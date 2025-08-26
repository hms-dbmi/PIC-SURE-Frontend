import { N as attr, M as attr_class, K as escape_html, P as stringify } from './index-C5NonOVO.js';

function ErrorAlert($$payload, $$props) {
  let {
    title,
    color = "error",
    solid = false,
    icon = true,
    iconSize = "4xl",
    closeText = "Close",
    "data-testid": testid = "error-alert",
    onclose,
    children
  } = $$props;
  $$payload.out += `<aside${attr("data-testid", testid)}${attr_class(`card flex gap-4 preset-${stringify(solid ? "filled" : "tonal")}-${stringify(color)}${stringify(solid ? "-500" : "")} border border-${stringify(color)}-500 py-2 px-3 m-2`)}>`;
  if (icon) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<i${attr_class(`fa-solid fa-circle-exclamation text-${stringify(iconSize)} content-center`)} aria-hidden="true"></i>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="alert-message content-center">`;
  if (title) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<h3 class="h3 text-left">${escape_html(title)}</h3>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  children?.($$payload);
  $$payload.out += `<!----> `;
  if (onclose) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div class="alert-actions"><button><i class="fa-solid fa-xmark"></i> <span class="sr-only">${escape_html(closeText)}</span></button></div>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></div></aside>`;
}

export { ErrorAlert as E };
//# sourceMappingURL=ErrorAlert-Sg5STlCJ.js.map
