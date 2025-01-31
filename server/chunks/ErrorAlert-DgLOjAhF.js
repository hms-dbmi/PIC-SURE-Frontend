import { c as create_ssr_component, e as escape } from './ssr-BRJpAXVH.js';

const ErrorAlert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  let { color = "error" } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.color === void 0 && $$bindings.color && color !== void 0) $$bindings.color(color);
  return `<aside data-testid="error-alert" class="${"alert variant-ghost-" + escape(color, true)}"><i class="fa-solid fa-circle-exclamation text-4xl" aria-hidden="true"></i> <div class="alert-message"><h3 class="h3 text-left">${escape(title)}</h3> ${slots.default ? slots.default({}) : ``}</div></aside>`;
});

export { ErrorAlert as E };
//# sourceMappingURL=ErrorAlert-DgLOjAhF.js.map
