<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { textInput } from '$lib/utilities/Validation';

  import { type Role } from '$lib/models/Role';
  import RolesStore from '$lib/stores/Roles';
  const { addRole, updateRole } = RolesStore;

  interface Props {
    role?: Role | undefined;
    privilegeList: string[][];
  }

  let { role = undefined, privilegeList }: Props = $props();

  let name = $state(role ? role.name : '');
  let description = $state(role ? role.description : '');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let privileges = $state(
    privilegeList.map(([_name, uuid]) => ({
      uuid,
      checked: role ? role.privileges.includes(uuid) : false,
    })),
  );

  async function saveRole() {
    let newRole: Role = {
      name,
      description,
      privileges: privileges.filter((priv) => priv.checked).map((priv) => priv.uuid),
    };
    try {
      if (role) {
        newRole = { ...newRole, uuid: role.uuid };
        await updateRole(newRole);
      } else {
        await addRole(newRole);
      }
      toastStore.trigger({
        message: `Successfully saved ${newRole ? 'new role' : 'role'} '${name}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/authorization');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newRole ? 'new role' : 'role'} '${name}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form onsubmit={preventDefault(saveRole)}>
  <label class="label required">
    <span>Name:</span>
    <input
      type="text"
      bind:value={name}
      class="input"
      required
      pattern={textInput}
      minlength="1"
      maxlength="255"
    />
  </label>

  <label class="label required">
    <span>Description:</span>
    <input
      type="text"
      bind:value={description}
      class="input"
      required
      pattern={textInput}
      minlength="1"
      maxlength="255"
    />
  </label>

  <fieldset data-testid="privilege-checkboxes">
    <legend>Privileges:</legend>
    {#each privilegeList as [name], index}
      <label class="flex items-center space-x-2">
        <input class="checkbox" type="checkbox" bind:checked={privileges[index].checked} />
        <p>{name}</p>
      </label>
    {/each}
  </fieldset>

  <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">
    Save
  </button>
  <a href="/admin/authorization" class="btn variant-ghost-secondary hover:variant-filled-secondary">
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
