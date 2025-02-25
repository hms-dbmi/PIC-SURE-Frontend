import { c as create_ssr_component, a as add_attribute, e as escape } from './ssr-BRJpAXVH.js';
import './client-BR749xJD.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './Connections-DvSl4MbM.js';

const ConnectionForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getToastStore();
  let { connection = void 0 } = $$props;
  let label = connection?.label || "";
  let id = connection?.id || "";
  let subPrefix = connection?.subPrefix || "";
  let requiredFields = connection?.requiredFields || "";
  if ($$props.connection === void 0 && $$bindings.connection && connection !== void 0) $$bindings.connection(connection);
  return `<p class="mb-3 text-center" data-svelte-h="svelte-kaypeb">For details on how to set up a Connection, please refer to the
  <a href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure/all-in-one-authentication-configuration#additional-authentication-configuration-option-s" target="_blank" class="anchor">PIC-SURE developer guide</a>.</p> <form class="grid gap-4 my-3">${connection?.uuid ? `<label class="label"><span data-svelte-h="svelte-xruxbf">UUID:</span> <input type="text" class="input"${add_attribute("value", connection?.uuid, 0)} ${"disabled"}></label>` : ``} <label class="label required"><span data-svelte-h="svelte-3s99bi">Label:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", label, 0)}></label> <label class="label required"><span data-svelte-h="svelte-1dt9zf9">ID:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", id, 0)}></label> <label class="label required"><span data-svelte-h="svelte-hkdo9q">Sub Prefix:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", subPrefix, 0)}></label> <label class="label"><span data-svelte-h="svelte-1cilozi">Required Fields:</span> <textarea class="w-full input input-border">${escape(requiredFields || "")}</textarea></label> ${``} <div data-svelte-h="svelte-1u8xx9t"><button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">Save</button> <a href="/admin/configuration" class="btn variant-ghost-secondary hover:variant-filled-secondary">Cancel</a></div></form>`;
});

export { ConnectionForm as C };
//# sourceMappingURL=ConnectionForm-BEvbSXvm.js.map
