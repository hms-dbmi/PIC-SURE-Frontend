<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import { textInput } from '$lib/utilities/Validation';

  import type { Privilege } from '$lib/models/Privilege';
  import PrivilegesStore from '$lib/stores/Privileges';
  const { addPrivilege, updatePrivilege } = PrivilegesStore;

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
        message: `Successfully saved ${newPrivilege ? 'new privilege' : 'privilege'} '${name}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/authorization');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${
          newPrivilege ? 'new privilege' : 'privilege'
        } '${name}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form on:submit|preventDefault={savePrivilege}>
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

  <label class="label required">
    <span>Application:</span>
    <select class="select" bind:value={application} required>
      <option selected={!privilege || !privilege.application} disabled value>none</option>
      {#each applicationList as [name, uuid]}
        <option value={uuid} selected={privilege && privilege.application === uuid}>{name}</option>
      {/each}
    </select>
  </label>

  <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">
    Save
  </button>
  <a href="/admin/authorization" class="btn variant-ghost-secondary hover:variant-filled-secondary">
    Cancel
  </a>
</form>

<style>
  label {
    margin: 0.5em 0;
  }
</style>
