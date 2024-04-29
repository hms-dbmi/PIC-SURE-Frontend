<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { type ExtendedUser } from '$lib/models/User';
  import { type Connection } from '$lib/models/Connection';
  import UsersStore from '$lib/stores/Users';
  import ConnectionStore from '$lib/stores/Connections';
  import RoleStore from '$lib/stores/Roles';
  import PrivilegesStore from '$lib/stores/Privileges';
  const { addUser, updateUser } = UsersStore;
  const { getConnection } = ConnectionStore;
  const { getRole } = RoleStore;
  const { getPrivilege } = PrivilegesStore;

  export let user: ExtendedUser | undefined = undefined;
  export let roleList: string[][];
  export let connections: Connection[];

  let email = user ? user.email : '';
  let connection = user ? user.connection : '';
  let active = user ? user.active : true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let roles = roleList.map(([_name, uuid]) => ({
    uuid,
    checked: user ? user.roles.includes(uuid) : false,
  }));

  async function saveUser() {
    const generalMetadata = JSON.parse(user?.generalMetadata || '{"email":""}');
    generalMetadata.email = email;

    let newUser = {
      email,
      connection: await getConnection(connection),
      generalMetadata: JSON.stringify(generalMetadata),
      active,
      roles: await Promise.all(
        roles
          .filter((role) => role.checked)
          .map((role) =>
            getRole(role.uuid).then((role) => ({
              ...role,
              privileges: role.privileges.map((uuid: string) => getPrivilege(uuid)),
            })),
          ),
      ),
    };
    try {
      if (user) {
        await updateUser({ ...newUser, uuid: user.uuid });
      } else {
        await addUser(newUser);
      }
      toastStore.trigger({
        message: `Successfully saved ${newUser ? 'new user' : 'user'} '${email}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/users');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newUser ? 'new user' : 'user'} '${email}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form on:submit|preventDefault={saveUser}>
  <label class="flex items-center space-x-2">
    <input class="checkbox" type="checkbox" bind:checked={active} />
    <p>Active</p>
  </label>

  <label class="label required">
    <span>Email:</span>
    <input type="email" bind:value={email} class="input" required minlength="1" maxlength="255" />
  </label>

  <label class="label required">
    <span>Connection:</span>
    <select class="select" bind:value={connection} required>
      <option selected={!user || !user.connection} disabled value>none</option>
      {#each connections as connection}
        <option value={connection.uuid} selected={user && user.connection === connection.uuid}
          >{connection.label}</option
        >
      {/each}
    </select>
  </label>

  <fieldset data-testid="privilege-checkboxes">
    <legend>Roles:</legend>
    {#each roleList as [name], index}
      <label class="flex items-center space-x-2">
        <input class="checkbox" type="checkbox" bind:checked={roles[index].checked} />
        <p>{name}</p>
      </label>
    {/each}
  </fieldset>

  <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">
    Save
  </button>
  <a href="/admin/users" class="btn variant-ghost-secondary hover:variant-filled-secondary">
    Cancel
  </a>
</form>

<style>
  label,
  fieldset {
    margin: 0.5em 0;
  }
  fieldset label {
    margin: 0;
  }
</style>
