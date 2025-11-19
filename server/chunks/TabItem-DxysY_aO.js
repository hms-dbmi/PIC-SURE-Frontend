import { x as push, O as attr, N as attr_class, Q as stringify, Z as bind_props, z as pop } from './index-DMPVr6nO.js';
import { h as html } from './html2-FW6Ia4bL.js';
import { createHighlighterCoreSync } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
import console from 'shiki/langs/console.mjs';
import python from 'shiki/langs/python.mjs';
import r from 'shiki/langs/r.mjs';

const shiki = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  themes: [themeDarkPlus],
  langs: [console, python, r]
});
function CodeBlock($$payload, $$props) {
  push();
  let { code = "", lang = "console", theme = "dark-plus" } = $$props;
  const generatedHtml = shiki.codeToHtml(code, { lang, theme });
  $$payload.out.push(`<div class="code-block">${html(generatedHtml)}</div>`);
  pop();
}
function TabItem($$payload, $$props) {
  push();
  let { group = "", value = "", children } = $$props;
  let active = group === value;
  $$payload.out.push(`<button data-scope="tabs" data-part="trigger" role="tab" type="button" dir="ltr" data-orientation="horizontal" data-value="Python" aria-selected="true" data-selected=""${attr("aria-controls", `tabs:s5:content-${stringify(value)}`)} data-ownedby="tabs:s5:list"${attr("id", `tabs:s5:trigger-${stringify(value)}`)}${attr_class(`border-b-[1px] border-transparent pb-2 translate-y-[1px] ${stringify(active ? "border-b-surface-950-50 opacity-100" : "[&amp;:not(:hover)]:opacity-50")}`)} data-testid="tabs-control"><div class="btn hover:preset-tonal-primary" data-testid="tabs-control-label"><span>`);
  children?.($$payload);
  $$payload.out.push(`<!----></span></div></button>`);
  bind_props($$props, { group });
  pop();
}

export { CodeBlock as C, TabItem as T };
//# sourceMappingURL=TabItem-DxysY_aO.js.map
