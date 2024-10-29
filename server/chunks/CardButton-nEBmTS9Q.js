import { k as createEventDispatcher } from './lifecycle-GVhEEkqU.js';
import { c as create_ssr_component, a as add_attribute, e as escape } from './ssr-Di-o4HBA.js';

const CardButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  createEventDispatcher();
  let { title } = $$props;
  let { icon = "" } = $$props;
  let { href = "" } = $$props;
  let { subtitle = "" } = $$props;
  let { size = "lg" } = $$props;
  let { disabled = false } = $$props;
  let { active = false } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.icon === void 0 && $$bindings.icon && icon !== void 0) $$bindings.icon(icon);
  if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
  if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
  if ($$props.size === void 0 && $$bindings.size && size !== void 0) $$bindings.size(size);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.active === void 0 && $$bindings.active && active !== void 0) $$bindings.active(active);
  return `${href ? `<a${add_attribute("href", href, 0)}${add_attribute("data-testid", $$props["data-testid"], 0)}${add_attribute("aria-disabled", disabled || void 0, 0)}${add_attribute("target", href.startsWith("/") ? void 0 : "_blank", 0)} class="${[
    "card-btn " + escape(size !== "other" ? "card-btn-" + size : "", true) + " " + escape($$props.class ?? "", true),
    (active ? "variant-filled-primary" : "") + " " + (!active ? "variant-ringed-primary" : "")
  ].join(" ").trim()}"${add_attribute("rel", disabled ? "nofollow" : void 0, 0)} tabindex="0">${icon ? `<i class="${"icon " + escape(icon, true)}"></i>` : ``} <div class="title">${escape(title)}</div> ${subtitle && !["sm", "md"].includes(size) ? `<div class="subtitle">${escape(subtitle)}</div>` : ``}</a>` : `<button${add_attribute("data-testid", $$props["data-testid"], 0)} type="button" class="${[
    "card-btn " + escape(size !== "other" ? "card-btn-" + size : "", true) + " " + escape($$props.class ?? "", true),
    (active ? "variant-filled-primary" : "") + " " + (!active ? "variant-ringed-primary" : "")
  ].join(" ").trim()}" ${disabled ? "disabled" : ""}>${icon ? `<i class="${"icon " + escape(icon, true)}"></i>` : ``} <div class="title">${escape(title)}</div> ${subtitle && !["sm", "md"].includes(size) ? `<div class="subtitle">${escape(subtitle)}</div>` : ``}</button>`}`;
});

export { CardButton as C };
//# sourceMappingURL=CardButton-nEBmTS9Q.js.map
