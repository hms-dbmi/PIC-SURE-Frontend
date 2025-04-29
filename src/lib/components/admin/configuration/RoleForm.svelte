<script lang="ts">
  import { goto } from '$app/navigation';

  import { type Role } from '$lib/models/Role';
  import { addRole, updateRole } from '$lib/stores/Roles';
  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  interface Props {
    role?: Role | undefined;
    privilegeList: string[][];
  }

  let { role = undefined, privilegeList }: Props = $props();

  let name = $state(role ? role.name : '');
  let description = $state(role ? role.description : '');
  let privileges = $state(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    privilegeList.map(([_name, uuid]) => ({
      uuid,
      checked: role ? role.privileges.includes(uuid) : false,
    })),
  );
  let validationError: string = $state('');

  async function saveRole(event: Event) {
    event.preventDefault();
    const selectedPrivileges = privileges.filter((priv) => priv.checked).map((priv) => priv.uuid);

    if (selectedPrivileges.length === 0) {
      validationError = 'At least one privilege must be selected.';
      return;
    } else {
      validationError = '';
    }

    let newRole: Role = {
      name,
      description,
      privileges: selectedPrivileges,
    };
    try {
      if (role) {
        newRole = { ...newRole, uuid: role.uuid };
        await updateRole(newRole);
      } else {
        await addRole(newRole);
      }
      toaster.success({
        title: `Successfully saved ${newRole && 'new '}role '${name}'`,
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while saving ${newRole && 'new '}role '${name}'`,
      });
    }
  }
</script>

<form onsubmit={saveRole}>
  <fieldset data-testid="role-form" class="grid gap-4 my-3" disabled={!$isTopAdmin}>
    {#if role?.uuid}
      <label class="label">
        <span>UUID:</span>
        <input type="text" class="input" value={role?.uuid} readonly={true} />
      </label>
    {/if}

    <label class="label required">
      <span>Name:</span>
      <input type="text" bind:value={name} class="input" required minlength="1" maxlength="255" />
    </label>

    <label class="label required">
      <span>Description:</span>
      <input
        type="text"
        bind:value={description}
        class="input"
        required
        minlength="1"
        maxlength="255"
      />
    </label>

    <fieldset data-testid="privilege-checkboxes">
      <legend class="required">Privileges:</legend>
      {#each privilegeList as [name], index}
        <label class="flex items-center space-x-2">
          <input class="checkbox" type="checkbox" bind:checked={privileges[index].checked} />
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
        data-testid="role-save-btn"
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      >
        Save
      </button>
      <a
        href="/admin/configuration"
        data-testid="role-cancel-btn"
        class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
      >
        Cancel
      </a>
    </div>
  </fieldset>
</form>
