import { x as push, O as attr, N as attr_class, P as clsx, M as escape_html, z as pop, Q as stringify } from './index-BYsoXH7a.js';

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
  const cardClasses = `card card-btn ${size !== "other" ? "card-btn-" + size : ""} ${className} hover:scale-110 hover:shadow-lg`;
  if (href) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<a${attr("href", href)}${attr("data-testid", testid)}${attr("aria-disabled", disabled || void 0)}${attr("target", href.startsWith("/") ? void 0 : "_blank")}${attr_class(clsx(cardClasses), void 0, {
      "preset-filled-primary-500": active,
      "preset-outlined-primary-500": !active
    })}${attr("rel", disabled ? "nofollow" : void 0)} tabindex="0">`);
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
    $$payload.out.push(`<!--]--></a>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button${attr("data-testid", testid)} type="button"${attr_class(clsx(cardClasses), void 0, {
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
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}

export { CardButton as C };
//# sourceMappingURL=CardButton-BSvkZqlJ.js.map
