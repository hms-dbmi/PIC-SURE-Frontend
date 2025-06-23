import { x as push, N as attr, M as attr_class, O as clsx, K as escape_html, z as pop, P as stringify } from './index-BKfiikQf.js';

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
    $$payload.out += "<!--[-->";
    $$payload.out += `<a${attr("href", href)}${attr("data-testid", testid)}${attr("aria-disabled", disabled || void 0)}${attr("target", href.startsWith("/") ? void 0 : "_blank")}${attr_class(clsx(cardClasses), void 0, {
      "preset-filled-primary-500": active,
      "preset-outlined-primary-500": !active
    })}${attr("rel", disabled ? "nofollow" : void 0)} tabindex="0">`;
    if (icon) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i${attr_class(`icon ${stringify(icon)}`)}></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="title">${escape_html(title)}</div> `;
    if (subtitle && !["sm", "md"].includes(size)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="subtitle">${escape_html(subtitle)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></a>`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button${attr("data-testid", testid)} type="button"${attr_class(clsx(cardClasses), void 0, {
      "preset-filled-primary-500": active,
      "preset-outlined-primary-500": !active
    })}${attr("disabled", disabled, true)}>`;
    if (icon) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<i${attr_class(`icon ${stringify(icon)}`)}></i>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--> <div class="title">${escape_html(title)}</div> `;
    if (subtitle && !["sm", "md"].includes(size)) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<div class="subtitle">${escape_html(subtitle)}</div>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]--></button>`;
  }
  $$payload.out += `<!--]-->`;
  pop();
}

export { CardButton as C };
//# sourceMappingURL=CardButton-CFKFjxAJ.js.map
