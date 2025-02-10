<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { type Role } from '$lib/models/Role';
  import { addRole, updateRole } from '$lib/stores/Roles';

  export let role: Role | undefined = undefined;
  export let privilegeList: string[][];

  let name = role ? role.name : '';
  let description = role ? role.description : '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let privileges = privilegeList.map(([_name, uuid]) => ({
    uuid,
    checked: role ? role.privileges.includes(uuid) : false,
  }));
  let validationError: string = '';

  async function saveRole() {
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
      toastStore.trigger({
        message: `Successfully saved ${newRole && 'new '}role '${name}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newRole && 'new '}role '${name}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form on:submit|preventDefault={saveRole} class="grid gap-4 my-3">
  {#if role?.uuid}
    <label class="label">
      <span>UUID:</span>
      <input type="text" class="input" value={role?.uuid} disabled={true} />
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
    <legend class="required"><span>Privileges:</span></legend>
    {#each privilegeList as [name], index}
      <label class="flex items-center space-x-2">
        <input class="checkbox" type="checkbox" bind:checked={privileges[index].checked} />
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
        <button on:click={() => (validationError = '')}>
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
    <a
      href="/admin/configuration"
      class="btn variant-ghost-secondary hover:variant-filled-secondary"
    >
      Cancel
    </a>
  </div>
</form>
