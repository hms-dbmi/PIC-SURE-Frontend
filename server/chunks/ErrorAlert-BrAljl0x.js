import { O as attr, N as attr_class, M as escape_html, Q as stringify } from './index-DMPVr6nO.js';

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
  $$payload.out.push(`<aside${attr("data-testid", testid)}${attr_class(`card flex gap-4 preset-${stringify(solid ? "filled" : "tonal")}-${stringify(color)}${stringify(solid ? "-500" : "")} border border-${stringify(color)}-500 py-2 px-3 m-2`)}>`);
  if (icon) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<i${attr_class(`fa-solid fa-circle-exclamation text-${stringify(iconSize)} content-center`)} aria-hidden="true"></i>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="alert-message content-center">`);
  if (title) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h3 class="h3 text-left">${escape_html(title)}</h3>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  children?.($$payload);
  $$payload.out.push(`<!----> `);
  if (onclose) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="alert-actions"><button><i class="fa-solid fa-xmark"></i> <span class="sr-only">${escape_html(closeText)}</span></button></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div></aside>`);
}

export { ErrorAlert as E };
//# sourceMappingURL=ErrorAlert-BrAljl0x.js.map
