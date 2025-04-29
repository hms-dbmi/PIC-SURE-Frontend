<script lang="ts">
  import { goto } from '$app/navigation';
  import { Switch } from '@skeletonlabs/skeleton-svelte';

  import type { ExtendedUser, UserRequest } from '$lib/models/User';
  import type { Connection } from '$lib/models/Connection';

  import { addUser, updateUser, getUserByEmailAndConnection } from '$lib/stores/Users';
  import { getConnection } from '$lib/stores/Connections';
  import { getRole } from '$lib/stores/Roles';
  import { getPrivilege } from '$lib/stores/Privileges';
  import { toaster } from '$lib/toaster';

  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Props {
    user?: ExtendedUser | undefined;
    roleList: string[][];
    connections: Connection[];
  }

  let { user = undefined, roleList, connections }: Props = $props();

  let email: string = $state(user && user.email ? user.email : '');
  let connection: string = $state(user && user.connection ? user.connection : '');
  let active: boolean = $state(user ? user.active : true);
  let roles = $state(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    roleList.map(([_name, uuid]) => ({
      uuid,
      checked: user ? user.roles.includes(uuid) : false,
    })),
  );
  let validationError: string = $state('');

  async function saveUser(event: Event) {
    event.preventDefault();
    const selectedRoles = roles.filter((role) => role.checked);
    if (selectedRoles.length === 0) {
      validationError = 'At least one role must be selected.';
      return;
    } else {
      validationError = '';
    }

    const generalMetadata = JSON.parse(user?.generalMetadata || '{"email":""}');
    generalMetadata.email = email;

    let newUser: UserRequest = {
      email,
      connection: await getConnection(connection),
      generalMetadata: JSON.stringify(generalMetadata),
      active,
      roles: await Promise.all(
        selectedRoles.map((role) =>
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
        const findUser = await getUserByEmailAndConnection(email, connection);
        if (findUser) {
          toaster.error({
            title: 'Cannot add a user and connection pair that already exists.',
          });
          return;
        }

        await addUser(newUser);
      }

      toaster.success({
        title: `Successfully saved ${user ? '' : 'new '}user '${email}'`,
      });
      goto('/admin/users');
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while saving ${user ? '' : 'new '}user '${email}'`,
      });
    }
  }
</script>

<form onsubmit={saveUser}>
  <fieldset data-testid="user-form" class="grid gap-4 my-3">
    <Switch
      name="Active"
      controlActive="bg-success-500"
      label="Status"
      checked={active}
      onCheckedChange={() => (active = !active)}
    >
      {active ? 'Active' : 'Inactive'}
    </Switch>

    {#if user?.uuid}
      <label class="label">
        <span>UUID:</span>
        <input type="text" class="input" value={user?.uuid} disabled />
      </label>
      <label class="label">
        <span>Subject:</span>
        <input type="text" class="input" value={user?.subject} disabled />
      </label>
    {/if}

    <label class="label {user?.email ?? 'required'}">
      <span>Email:</span>
      <input
        type="email"
        bind:value={email}
        class="input"
        required
        disabled={!!user?.email}
        minlength="1"
        maxlength="255"
      />
    </label>

    <label class="label {user?.email ?? 'required'}">
      <span>Connection:</span>
      <select class="select" bind:value={connection} required disabled={!!user?.connection}>
        <option selected={!user || !user.connection} disabled value>none</option>
        {#each connections as connection}
          <option value={connection.uuid} selected={user && user.connection === connection.uuid}
            >{connection.label}</option
          >
        {/each}
      </select>
    </label>

    <fieldset data-testid="privilege-checkboxes">
      <legend class="required">Roles:</legend>
      {#each roleList as [name], index}
        <label class="flex items-center space-x-2">
          <input class="checkbox" type="checkbox" bind:checked={roles[index].checked} />
          <div>{name}</div>
        </label>
      {/each}
    </fieldset>

    {#if validationError}
      <ErrorAlert data-testid="validation-error" onclose={() => (validationError = '')}>
        {validationError}
      </ErrorAlert>
    {/if}

    <div class="mt-2">
      <button
        type="submit"
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      >
        Save
      </button>
      <a
        href="/admin/users"
        class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
      >
        Cancel
      </a>
    </div>
  </fieldset>
</form>
