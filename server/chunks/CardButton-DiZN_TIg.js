import { x as push, O as attr, N as attr_class, M as escape_html, z as pop, Q as stringify } from './index-C9dy-hDW.js';
import '@sveltejs/kit/internal';
import './utils-D3IkxnGP.js';
import './client2-BVaV_p61.js';

function CardButton($$payload, $$props) {
  push();
  const {
    title,
    icon = "",
    href = "",
    subtitle = "",
    size = "lg",
    disabled = false,
    active = false,
    "data-testid": testid = "",
    class: className = "",
    onclick = () => {
    }
  } = $$props;
  $$payload.out.push(`<button${attr("data-testid", testid)} type="button"${attr_class(`card card-btn ${size !== "other" ? "card-btn-" + size : ""} ${className}`, void 0, {
    "preset-filled-primary-500": active,
    "preset-outlined-primary-500": !active
  })}${attr("disabled", disabled, true)}>`);
  if (icon) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<i${attr_class(`icon ${stringify(icon)}`)}></i>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div class="title">${escape_html(title)}</div> `);
  if (subtitle && !["sm", "md"].includes(size)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="subtitle">${escape_html(subtitle)}</div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></button>`);
  pop();
}

export { CardButton as C };
//# sourceMappingURL=CardButton-DiZN_TIg.js.map
