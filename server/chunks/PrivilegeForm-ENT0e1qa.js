import { c as create_ssr_component, a as add_attribute, b as each, e as escape } from './ssr-BRJpAXVH.js';
import './client-BR749xJD.js';
import { g as getToastStore } from './stores2-Cy1ftf_v.js';
import './ProgressBar.svelte_svelte_type_style_lang-3a6XZCfa.js';
import './Privileges-CBJvRnMc.js';

const css = {
  code: "label.svelte-1pdeqr{margin:0.5em 0}",
  map: '{"version":3,"file":"PrivilegeForm.svelte","sources":["PrivilegeForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { goto } from \\"$app/navigation\\";\\nimport { getToastStore } from \\"@skeletonlabs/skeleton\\";\\nconst toastStore = getToastStore();\\nimport { addPrivilege, updatePrivilege } from \\"$lib/stores/Privileges\\";\\nexport let privilege = void 0;\\nexport let applicationList;\\nlet name = privilege ? privilege.name : \\"\\";\\nlet description = privilege ? privilege.description : \\"\\";\\nlet application = privilege ? privilege.application : \\"\\";\\nasync function savePrivilege() {\\n  let newPrivilege = {\\n    name,\\n    description,\\n    application\\n  };\\n  try {\\n    if (privilege) {\\n      newPrivilege = { ...newPrivilege, uuid: privilege.uuid };\\n      await updatePrivilege(newPrivilege);\\n    } else {\\n      await addPrivilege(newPrivilege);\\n    }\\n    toastStore.trigger({\\n      message: `Successfully saved ${newPrivilege && \\"new \\"}privilege \'${name}\'`,\\n      background: \\"variant-filled-success\\"\\n    });\\n    goto(\\"/admin/configuration\\");\\n  } catch (error) {\\n    console.error(error);\\n    toastStore.trigger({\\n      message: `An error occured while saving ${newPrivilege && \\"new \\"}privilege \'${name}\'`,\\n      background: \\"variant-filled-error\\"\\n    });\\n  }\\n}\\n<\/script>\\n\\n<form on:submit|preventDefault={savePrivilege} class=\\"grid gap-4 my-3\\">\\n  {#if privilege?.uuid}\\n    <label class=\\"label\\">\\n      <span>UUID:</span>\\n      <input type=\\"text\\" class=\\"input\\" value={privilege?.uuid} disabled={true} />\\n    </label>\\n  {/if}\\n\\n  <label class=\\"label required\\">\\n    <span>Name:</span>\\n    <input type=\\"text\\" bind:value={name} class=\\"input\\" required minlength=\\"1\\" maxlength=\\"255\\" />\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Description:</span>\\n    <input\\n      type=\\"text\\"\\n      bind:value={description}\\n      class=\\"input\\"\\n      required\\n      minlength=\\"1\\"\\n      maxlength=\\"255\\"\\n    />\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Application:</span>\\n    <select class=\\"select\\" bind:value={application} required>\\n      <option value=\\"\\" disabled>Select an application</option>\\n      {#each applicationList as [name, uuid]}\\n        <option value={uuid}>{name}</option>\\n      {/each}\\n    </select>\\n  </label>\\n\\n  <div>\\n    <button type=\\"submit\\" class=\\"btn variant-ghost-primary hover:variant-filled-primary\\">\\n      Save\\n    </button>\\n    <a\\n      href=\\"/admin/configuration\\"\\n      class=\\"btn variant-ghost-secondary hover:variant-filled-secondary\\"\\n    >\\n      Cancel\\n    </a>\\n  </div>\\n</form>\\n\\n<style>\\n  label {\\n    margin: 0.5em 0;\\n  }</style>\\n"],"names":[],"mappings":"AAsFE,mBAAM,CACJ,MAAM,CAAE,KAAK,CAAC,CAChB"}'
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
  return `<form class="grid gap-4 my-3">${privilege?.uuid ? `<label class="label svelte-1pdeqr"><span data-svelte-h="svelte-xruxbf">UUID:</span> <input type="text" class="input"${add_attribute("value", privilege?.uuid, 0)} ${"disabled"}></label>` : ``} <label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-m2peuz">Name:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", name, 0)}></label> <label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-n5lbfe">Description:</span> <input type="text" class="input" required minlength="1" maxlength="255"${add_attribute("value", description, 0)}></label> <label class="label required svelte-1pdeqr"><span data-svelte-h="svelte-u1sl8e">Application:</span> <select class="select" required><option value="" disabled data-svelte-h="svelte-e5qj4t">Select an application</option>${each(applicationList, ([name2, uuid]) => {
    return `<option${add_attribute("value", uuid, 0)}>${escape(name2)}</option>`;
  })}</select></label> <div data-svelte-h="svelte-1u8xx9t"><button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">Save</button> <a href="/admin/configuration" class="btn variant-ghost-secondary hover:variant-filled-secondary">Cancel</a></div> </form>`;
});

export { PrivilegeForm as P };
//# sourceMappingURL=PrivilegeForm-ENT0e1qa.js.map
