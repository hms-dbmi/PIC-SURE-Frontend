import { c as create_ssr_component, e as escape } from './ssr-C099ZcAV.js';

const ErrorAlert = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  return `<aside data-testid="error-alert" class="alert variant-filled-error"><i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i> <div class="alert-message"><h3 class="h3 text-left">${escape(title)}</h3> ${slots.default ? slots.default({}) : ``}</div></aside>`;
});

export { ErrorAlert as E };
//# sourceMappingURL=ErrorAlert-C4rfD0QC.js.map
