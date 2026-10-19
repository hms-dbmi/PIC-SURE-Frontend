<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import { type Role } from '#lib/auth/model/role.ts';
  import * as admin from '#lib/admin/entities.ts';
  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  interface Props {
    role?: Role | undefined;
    privilegeList: string[][];
  }

  let { role = undefined, privilegeList }: Props = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(role ? role.name : '');
  // svelte-ignore state_referenced_locally
  let description = $state(role ? role.description : '');
  // svelte-ignore state_referenced_locally
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
        await admin.roles.update(newRole);
      } else {
        await admin.roles.add(newRole);
      }
      toaster.success({
        title: `Successfully saved ${role ? '' : 'new '}role '${name}'`,
      });
      goto(resolve('admin/configuration'));
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occurred while saving ${role ? '' : 'new '}role '${name}'`,
      });
    }
  }
</script>

<form onsubmit={saveRole}>
  <fieldset data-testid="admin-role-form" class="grid gap-4 my-3" disabled={!$isTopAdmin}>
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

    <fieldset data-testid="admin-role-privilege-checkboxes">
      <legend class="required">Privileges:</legend>
      {#each privilegeList as [name], index}
        <label class="flex items-center space-x-2">
          <input class="checkbox" type="checkbox" bind:checked={privileges[index].checked} />
          <div>{name}</div>
        </label>
      {/each}
    </fieldset>

    {#if validationError}
      <ErrorAlert data-testid="admin-form-validation-error" onclose={() => (validationError = '')}>
        {validationError}
      </ErrorAlert>
    {/if}

    <div class="mt-2">
      <Button variant="tonal" type="submit" data-testid="admin-role-save">Save</Button>
      <Button
        variant="tonal-secondary"
        href={resolve('admin/configuration')}
        data-testid="admin-role-cancel"
      >
        Cancel
      </Button>
    </div>
  </fieldset>
</form>
