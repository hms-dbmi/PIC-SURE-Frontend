import { c as create_ssr_component, a as add_attribute, b as each, e as escape } from './ssr-C099ZcAV.js';
import './client-DpIAX_q0.js';
import { g as getToastStore } from './stores2-DM9tzbse.js';
import './ProgressBar.svelte_svelte_type_style_lang-DykzLE77.js';
import './Connections-DJIq0v4i.js';
import './Roles-DREcG-yb.js';
import './Privileges-CP-P0XVS.js';

const css = {
  code: "label.svelte-1hg36ee.svelte-1hg36ee,fieldset.svelte-1hg36ee.svelte-1hg36ee{margin:0.5em 0}fieldset.svelte-1hg36ee label.svelte-1hg36ee{margin:0}",
  map: '{"version":3,"file":"UserForm.svelte","sources":["UserForm.svelte"],"sourcesContent":["<script lang=\\"ts\\">import { goto } from \\"$app/navigation\\";\\nimport { getToastStore } from \\"@skeletonlabs/skeleton\\";\\nconst toastStore = getToastStore();\\nimport {} from \\"$lib/models/User\\";\\nimport {} from \\"$lib/models/Connection\\";\\nimport UsersStore from \\"$lib/stores/Users\\";\\nimport ConnectionStore from \\"$lib/stores/Connections\\";\\nimport RoleStore from \\"$lib/stores/Roles\\";\\nimport PrivilegesStore from \\"$lib/stores/Privileges\\";\\nconst { addUser, updateUser } = UsersStore;\\nconst { getConnection } = ConnectionStore;\\nconst { getRole } = RoleStore;\\nconst { getPrivilege } = PrivilegesStore;\\nexport let user = void 0;\\nexport let roleList;\\nexport let connections;\\nlet email = user ? user.email : \\"\\";\\nlet connection = user ? user.connection : \\"\\";\\nlet active = user ? user.active : true;\\nlet roles = roleList.map(([_name, uuid]) => ({\\n  uuid,\\n  checked: user ? user.roles.includes(uuid) : false\\n}));\\nasync function saveUser() {\\n  const generalMetadata = JSON.parse(user?.generalMetadata || \'{\\"email\\":\\"\\"}\');\\n  generalMetadata.email = email;\\n  let newUser = {\\n    email,\\n    connection: await getConnection(connection),\\n    generalMetadata: JSON.stringify(generalMetadata),\\n    active,\\n    roles: await Promise.all(roles.filter((role) => role.checked).map((role) => getRole(role.uuid).then((role2) => ({\\n      ...role2,\\n      privileges: role2.privileges.map((uuid) => getPrivilege(uuid))\\n    }))))\\n  };\\n  try {\\n    if (user) {\\n      await updateUser({ ...newUser, uuid: user.uuid });\\n    } else {\\n      await addUser(newUser);\\n    }\\n    toastStore.trigger({\\n      message: `Successfully saved ${newUser ? \\"new user\\" : \\"user\\"} \'${email}\'`,\\n      background: \\"variant-filled-success\\"\\n    });\\n    goto(\\"/admin/users\\");\\n  } catch (error) {\\n    console.error(error);\\n    toastStore.trigger({\\n      message: `An error occured while saving ${newUser ? \\"new user\\" : \\"user\\"} \'${email}\'`,\\n      background: \\"variant-filled-error\\"\\n    });\\n  }\\n}\\n<\/script>\\n\\n<form on:submit|preventDefault={saveUser}>\\n  <label class=\\"flex items-center space-x-2\\">\\n    <input class=\\"checkbox\\" type=\\"checkbox\\" bind:checked={active} />\\n    <p>Active</p>\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Email:</span>\\n    <input type=\\"email\\" bind:value={email} class=\\"input\\" required minlength=\\"1\\" maxlength=\\"255\\" />\\n  </label>\\n\\n  <label class=\\"label required\\">\\n    <span>Connection:</span>\\n    <select class=\\"select\\" bind:value={connection} required>\\n      <option selected={!user || !user.connection} disabled value>none</option>\\n      {#each connections as connection}\\n        <option value={connection.uuid} selected={user && user.connection === connection.uuid}\\n          >{connection.label}</option\\n        >\\n      {/each}\\n    </select>\\n  </label>\\n\\n  <fieldset data-testid=\\"privilege-checkboxes\\">\\n    <legend>Roles:</legend>\\n    {#each roleList as [name], index}\\n      <label class=\\"flex items-center space-x-2\\">\\n        <input class=\\"checkbox\\" type=\\"checkbox\\" bind:checked={roles[index].checked} />\\n        <p>{name}</p>\\n      </label>\\n    {/each}\\n  </fieldset>\\n\\n  <button type=\\"submit\\" class=\\"btn variant-ghost-primary hover:variant-filled-primary\\">\\n    Save\\n  </button>\\n  <a href=\\"/admin/users\\" class=\\"btn variant-ghost-secondary hover:variant-filled-secondary\\">\\n    Cancel\\n  </a>\\n</form>\\n\\n<style>\\n  label,\\n  fieldset {\\n    margin: 0.5em 0;\\n  }\\n  fieldset label {\\n    margin: 0;\\n  }</style>\\n"],"names":[],"mappings":"AAmGE,mCAAK,CACL,sCAAS,CACP,MAAM,CAAE,KAAK,CAAC,CAChB,CACA,uBAAQ,CAAC,oBAAM,CACb,MAAM,CAAE,CACV"}'
};
const UserForm = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  getToastStore();
  let { user = void 0 } = $$props;
  let { roleList } = $$props;
  let { connections } = $$props;
  let email = user ? user.email : "";
  user ? user.connection : "";
  let active = user ? user.active : true;
  let roles = roleList.map(([_name, uuid]) => ({
    uuid,
    checked: user ? user.roles.includes(uuid) : false
  }));
  if ($$props.user === void 0 && $$bindings.user && user !== void 0) $$bindings.user(user);
  if ($$props.roleList === void 0 && $$bindings.roleList && roleList !== void 0) $$bindings.roleList(roleList);
  if ($$props.connections === void 0 && $$bindings.connections && connections !== void 0) $$bindings.connections(connections);
  $$result.css.add(css);
  return `<form><label class="flex items-center space-x-2 svelte-1hg36ee"><input class="checkbox" type="checkbox"${add_attribute("checked", active, 1)}> <p data-svelte-h="svelte-9a8exy">Active</p></label> <label class="label required svelte-1hg36ee"><span data-svelte-h="svelte-1s4kc5o">Email:</span> <input type="email" class="input" required minlength="1" maxlength="255"${add_attribute("value", email, 0)}></label> <label class="label required svelte-1hg36ee"><span data-svelte-h="svelte-ir2yyg">Connection:</span> <select class="select" required><option ${!user || !user.connection ? "selected" : ""} disabled value>none</option>${each(connections, (connection) => {
    return `<option${add_attribute("value", connection.uuid, 0)} ${user && user.connection === connection.uuid ? "selected" : ""}>${escape(connection.label)}</option>`;
  })}</select></label> <fieldset data-testid="privilege-checkboxes" class="svelte-1hg36ee"><legend data-svelte-h="svelte-1uxa1d9">Roles:</legend> ${each(roleList, ([name], index) => {
    return `<label class="flex items-center space-x-2 svelte-1hg36ee"><input class="checkbox" type="checkbox"${add_attribute("checked", roles[index].checked, 1)}> <p>${escape(name)}</p> </label>`;
  })}</fieldset> <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary" data-svelte-h="svelte-uo67us">Save</button> <a href="/admin/users" class="btn variant-ghost-secondary hover:variant-filled-secondary" data-svelte-h="svelte-13l4n87">Cancel</a> </form>`;
});

export { UserForm as U };
//# sourceMappingURL=UserForm-BOJ2x2xV.js.map
