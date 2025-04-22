<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore, SlideToggle } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import type { ExtendedUser, UserRequest } from '$lib/models/User';
  import type { Connection } from '$lib/models/Connection';

  import { addUser, updateUser, getUserByEmailAndConnection } from '$lib/stores/Users';
  import { getConnection } from '$lib/stores/Connections';
  import { getRole } from '$lib/stores/Roles';
  import { getPrivilege } from '$lib/stores/Privileges';

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
          toastStore.trigger({
            message: 'Cannot add a user and connection pair that already exists.',
            background: 'variant-filled-error',
          });
          return;
        }

        await addUser(newUser);
      }

      toastStore.trigger({
        message: `Successfully saved ${user ? '' : 'new '}user '${email}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/users');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${user ? '' : 'new '}user '${email}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form onsubmit={saveUser} class="grid gap-4 my-3">
  <SlideToggle name="Active" size="sm" active="bg-success-500" label="Status" bind:checked={active}>
    {active ? 'Active' : 'Inactive'}
  </SlideToggle>

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
        <p>{name}</p>
      </label>
    {/each}
  </fieldset>

  {#if validationError}
    <aside data-testid="validation-error" class="alert variant-ghost-error">
      <div class="alert-message">
        <p>{validationError}</p>
      </div>
      <div class="alert-actions">
        <button onclick={() => (validationError = '')}>
          <i class="fa-solid fa-xmark"></i>
          <span class="sr-only">Close</span>
        </button>
      </div>
    </aside>
  {/if}

  <div>
    <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">
      Save
    </button>
    <a href="/admin/users" class="btn variant-ghost-secondary hover:variant-filled-secondary">
      Cancel
    </a>
  </div>
</form>
