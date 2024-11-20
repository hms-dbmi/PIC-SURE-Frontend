import { c as create_ssr_component, a as add_attribute, e as escape } from './ssr-BRJpAXVH.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';

const CopyButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { itemToCopy } = $$props;
  let { text = "Copy" } = $$props;
  let { altText = "Copied!" } = $$props;
  let { useIcon = false } = $$props;
  let { icon = "fa-regular fa-copy" } = $$props;
  let { altIcon = "fa-regular fa-square-check" } = $$props;
  let buttonId = $$props["data-testid"] || "copy-btn";
  if ($$props.itemToCopy === void 0 && $$bindings.itemToCopy && itemToCopy !== void 0) $$bindings.itemToCopy(itemToCopy);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0) $$bindings.text(text);
  if ($$props.altText === void 0 && $$bindings.altText && altText !== void 0) $$bindings.altText(altText);
  if ($$props.useIcon === void 0 && $$bindings.useIcon && useIcon !== void 0) $$bindings.useIcon(useIcon);
  if ($$props.icon === void 0 && $$bindings.icon && icon !== void 0) $$bindings.icon(icon);
  if ($$props.altIcon === void 0 && $$bindings.altIcon && altIcon !== void 0) $$bindings.altIcon(altIcon);
  return `${useIcon ? `<button type="button"${add_attribute("data-testid", buttonId, 0)}${add_attribute("title", text, 0)} class="${"ml-4 text-black-600 hover:text-primary-600 " + escape($$props.class || "", true)}"><i class="${"fa-xl " + escape(icon, true)}"></i> <div data-testid="${escape(buttonId, true) + "-popup"}" class="rounded p-4 max-w-md shadow-2xl variant-filled-surface text-on-primary"${add_attribute("data-popup", buttonId, 0)}>${escape(altText)} <div class="arrow variant-filled-surface"></div></div></button>` : `<button type="button"${add_attribute("data-testid", buttonId, 0)}${add_attribute("title", text, 0)} class="${"ml-4 btn " + escape($$props.class || "", true)}">${escape(text)}</button>`}`;
});

export { CopyButton as C };
//# sourceMappingURL=CopyButton-BtLZ49Iw.js.map
