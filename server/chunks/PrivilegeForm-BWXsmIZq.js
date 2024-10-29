import { c as create_ssr_component, a as add_attribute, b as each, e as escape } from './ssr-Di-o4HBA.js';
import './client-TAfaRk9z.js';
import { g as getToastStore } from './stores2-DrFt-twL.js';
import './ProgressBar.svelte_svelte_type_style_lang-D52eF_WP.js';
import { t as textInput } from './Validation-DXCOBx8m.js';
import './Privileges-CBKVrBv7.js';

const css = {
  code: "label.svelte-1pdeqr{margin:0.5em 0}",
  map: '{"version":3,"file":"PrivilegeForm.svelte","sources":["PrivilegeForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { goto } from \\"$app/navigation\\";\\nimport { getToastStore } from \\"@skeletonlabs/skeleton\\";\\nconst toastStore = getToastStore();\\nimport { textInput } from \\"$lib/utilities/Validation\\";\\nimport PrivilegesStore from \\"$lib/stores/Privileges\\";\\nconst { addPrivilege, updatePrivilege } = PrivilegesStore;\\nexport let privilege = void 0;\\nexport let applicationList;\\nlet name = privilege ? privilege.name : \\"\\";\\nlet description = privilege ? privilege.description : \\"\\";\\nlet application = privilege ? privilege.application : \\"\\";\\nasync function savePrivilege() {\\n  let newPrivilege = {\\n    name,\\n    description,\\n    application\\n  };\\n  try {\\n    if (privilege) {\\n      newPrivilege = { ...newPrivilege, uuid: privilege.uuid };\\n      await updatePrivilege(newPrivilege);\\n    } else {\\n      await addPrivilege(newPrivilege);\\n    }\\n    toastStore.trigger({\\n      message: `Successfully saved ${newPrivilege ? \\"new privilege\\" : \\"privilege\\"} \'${name}\'`,\\n      background: \\"variant-filled-success\\"\\n    });\\n    goto(\\"/admin/authorization\\");\\n  } catch (error) {\\n    console.error(error);\\n    toastStore.trigger({\\n      message: `An error occured while saving ${newPrivilege ? \\"new privilege\\" : \\"privilege\\"} \'${name}\'`,\\n      background: \\"variant-filled-error\\"\\n    });\\n  }\\n}\\n<\/script>\\n\\n<form on:submit|preventDefault={savePrivilege}>\\n  <label class=\\"label required\\">\\n    <span>Name:</span>\\n    <input\\n      type=\\"text\\"\\n      bind:value={name}\\n      class=\\"input\\"\\n      required\\n      pattern={textInput}\\n      minlength=\\"1\\"\\n      maxlength=\\"255\\"\\n    />\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Description:</span>\\n    <input\\n      type=\\"text\\"\\n      bind:value={description}\\n      class=\\"input\\"\\n      required\\n      pattern={textInput}\\n      minlength=\\"1\\"\\n      maxlength=\\"255\\"\\n    />\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Application:</span>\\n    <select class=\\"select\\" bind:value={application} required>\\n      <option selected={!privilege || !privilege.application} disabled value>none</option>\\n      {#each applicationList as [name, uuid]}\\n        <option value={uuid} selected={privilege && privilege.application === uuid}>{name}</option>\\n      {/each}\\n    </select>\\n  </label>\\n\\n  <button type=\\"submit\\" class=\\"btn variant-ghost-primary hover:variant-filled-primary\\">\\n    Save\\n  </button>\\n  <a href=\\"/admin/authorization\\" class=\\"btn variant-ghost-secondary hover:variant-filled-secondary\\">\\n    Cancel\\n  </a>\\n</form>\\n\\n<style>\\n  label {\\n    margin: 0.5em 0;\\n  }</style>\\n"],"names":[],"mappings":"AAqFE,mBAAM,CACJ,MAAM,CAAE,KAAK,CAAC,CAChB"}'
};
const PrivilegeForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getToastStore();
  let { privilege = void 0 } = $$props;
  let { applicationList } = $$props;
  let name = privilege ? privilege.name : "";
  let description = privilege ? privilege.description : "";
  privilege ? privilege.application : "";
  if ($$props.privilege === void 0 && $$bindings.privilege && privilege !== void 0) $$bindings.privilege(privilege);
  if ($$props.applicationList === void 0 && $$bindings.applicationList && applicationList !== void 0) $$bindings.applicationList(applicationList);
  $$result.css.add(css);
  return `<form><label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-m2peuz">Name:</span> <input type="text" class="input" required${add_attribute("pattern", textInput, 0)} minlength="1" maxlength="255"${add_attribute("value", name, 0)}></label> <label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-n5lbfe">Description:</span> <input type="text" class="input" required${add_attribute("pattern", textInput, 0)} minlength="1" maxlength="255"${add_attribute("value", description, 0)}></label> <label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-u1sl8e">Application:</span> <select class="select" required><option ${!privilege || !privilege.application ? "selected" : ""} disabled value>none</option>${each(applicationList, ([name2, uuid]) => {
    return `<option${add_attribute("value", uuid, 0)} ${privilege && privilege.application === uuid ? "selected" : ""}>${escape(name2)}</option>`;
  })}</select></label> <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary" data-svelte-h="svelte-uo67us">Save</button> <a href="/admin/authorization" class="btn variant-ghost-secondary hover:variant-filled-secondary" data-svelte-h="svelte-muwtns">Cancel</a> </form>`;
});

export { PrivilegeForm as P };
//# sourceMappingURL=PrivilegeForm-BWXsmIZq.js.map
