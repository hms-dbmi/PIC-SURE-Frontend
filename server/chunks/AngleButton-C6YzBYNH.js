import { k as createEventDispatcher } from './lifecycle-DtuISP6h.js';
import { c as create_ssr_component, a as add_attribute, e as escape } from './ssr-BRJpAXVH.js';

const AngleButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let btnStyle;
  let { href = "" } = $$props;
  let { angle = "left" } = $$props;
  let { variant = "filled" } = $$props;
  let { color = "primary" } = $$props;
  let { disabled = false } = $$props;
  let { name = "" } = $$props;
  createEventDispatcher();
  const testid = $$props["data-testid"] || name.replaceAll(" ", "-").toLowerCase() + "-btn";
  if ($$props.href === void 0 && $$bindings.href && href !== void 0) $$bindings.href(href);
  if ($$props.angle === void 0 && $$bindings.angle && angle !== void 0) $$bindings.angle(angle);
  if ($$props.variant === void 0 && $$bindings.variant && variant !== void 0) $$bindings.variant(variant);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0) $$bindings.disabled(disabled);
  if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);
  btnStyle = `btn btn-sm h-fit variant-${variant}-${color} ${variant !== "filled" ? `hover:variant-filled-${color}` : ``} text-lg`;
  return `${href ? `<a${add_attribute("data-testid", testid, 0)}${add_attribute("aria-disabled", disabled, 0)} class="${escape(btnStyle, true) + " &amp;[aria-disabled=“true”]:opacity-75 " + escape($$props.class || "", true)}"${add_attribute("rel", disabled ? "nofollow" : "", 0)}${add_attribute("href", href, 0)}>${angle === "left" ? `<i class="fa-solid fa-arrow-left mr-3"></i>` : ``} ${slots.default ? slots.default({}) : ``} ${angle === "right" ? `<i class="fa-solid fa-arrow-right ml-3"></i>` : ``}</a>` : `<button${add_attribute("data-testid", testid, 0)} type="button" class="${escape(btnStyle, true) + " disabled:opacity-75 " + escape($$props.class || "", true)}" ${disabled ? "disabled" : ""}>${angle === "left" ? `<i class="fa-solid fa-arrow-left mr-3"></i>` : ``} ${slots.default ? slots.default({}) : ``} ${angle === "right" ? `<i class="fa-solid fa-arrow-right ml-3"></i>` : ``}</button>`}`;
});

export { AngleButton as A };
//# sourceMappingURL=AngleButton-C6YzBYNH.js.map
