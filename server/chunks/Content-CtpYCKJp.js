import { c as create_ssr_component, a as add_attribute, v as validate_component, e as escape } from './ssr-C099ZcAV.js';
import { A as AngleButton } from './AngleButton-C0svtr3S.js';
import './client-DpIAX_q0.js';

const Content = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { title = "" } = $$props;
  let { subtitle = "" } = $$props;
  let { backUrl = "" } = $$props;
  let { backAction = () => {
  } } = $$props;
  let { backTitle = "Back" } = $$props;
  let { full = false } = $$props;
  let { transition = false } = $$props;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0) $$bindings.title(title);
  if ($$props.subtitle === void 0 && $$bindings.subtitle && subtitle !== void 0) $$bindings.subtitle(subtitle);
  if ($$props.backUrl === void 0 && $$bindings.backUrl && backUrl !== void 0) $$bindings.backUrl(backUrl);
  if ($$props.backAction === void 0 && $$bindings.backAction && backAction !== void 0) $$bindings.backAction(backAction);
  if ($$props.backTitle === void 0 && $$bindings.backTitle && backTitle !== void 0) $$bindings.backTitle(backTitle);
  if ($$props.full === void 0 && $$bindings.full && full !== void 0) $$bindings.full(full);
  if ($$props.transition === void 0 && $$bindings.transition && transition !== void 0) $$bindings.transition(transition);
  return `<section${add_attribute("class", `main-content ${full ? "w-full" : ""} ${$$props.class ?? ""}`, 0)}>${backUrl ? `${validate_component(AngleButton, "AngleButton").$$render($$result, { name: "back", variant: "ghost" }, {}, {
    default: () => {
      return `${escape(backTitle)}`;
    }
  })}` : ``} ${title ? `<h1 class="${escape(backUrl ? "mb-4" : "my-4", true) + " text-center"}">${escape(title)}</h1>` : ``} ${subtitle ? `<p class="subtitle mb-4 text-center">${escape(subtitle)}</p>` : ``} ${slots.default ? slots.default({}) : ``}</section>`;
});

export { Content as C };
//# sourceMappingURL=Content-CtpYCKJp.js.map
