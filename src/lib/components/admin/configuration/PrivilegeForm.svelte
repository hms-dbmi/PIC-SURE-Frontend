<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import type { Privilege } from '$lib/models/Privilege';
  import { addPrivilege, updatePrivilege } from '$lib/stores/Privileges';
  import { isTopAdmin } from '$lib/stores/User';

  export let privilege: Privilege | undefined = undefined;
  export let applicationList: string[][];

  let name = privilege ? privilege.name : '';
  let description = privilege ? privilege.description : '';
  let application = privilege ? privilege.application : '';

  async function savePrivilege() {
    let newPrivilege: Privilege = {
      name,
      description,
      application,
    };
    try {
      if (privilege) {
        newPrivilege = { ...newPrivilege, uuid: privilege.uuid };
        await updatePrivilege(newPrivilege);
      } else {
        await addPrivilege(newPrivilege);
      }
      toastStore.trigger({
        message: `Successfully saved ${newPrivilege && 'new '}privilege '${name}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newPrivilege && 'new '}privilege '${name}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form on:submit|preventDefault={savePrivilege} class="grid gap-4 my-3">
  <fieldset data-testid="privilege-form" disabled={!$isTopAdmin}>
    {#if privilege?.uuid}
      <label class="label">
        <span>UUID:</span>
        <input type="text" class="input" value={privilege?.uuid} readonly={true} />
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

    <label class="label required">
      <span>Application:</span>
      <select class="select" bind:value={application} required>
        <option value="" disabled>Select an application</option>
        {#each applicationList as [name, uuid]}
          <option value={uuid}>{name}</option>
        {/each}
      </select>
    </label>

    <div>
      <button 
        type="submit" 
        data-testid="privilege-save-btn"
        class="btn variant-ghost-primary hover:variant-filled-primary">
        Save
      </button>
      <a
        href="/admin/configuration"
        data-testid="privilege-cancel-btn"
        class="btn variant-ghost-secondary hover:variant-filled-secondary"
      >
        Cancel
      </a>
    </div>
  </fieldset>
</form>

<style>
  label {
    margin: 0.5em 0;
  }
</style>
