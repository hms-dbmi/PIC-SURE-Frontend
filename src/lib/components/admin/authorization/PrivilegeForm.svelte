<script lang="ts">
  import type { Privilege } from '$lib/models/Privileges';

  export let privilege: Privilege | undefined = undefined;
  export let applicationList: string[][];
  export let onSave = () => {};

  let name;
  let description;
  let application;
</script>

<label class="label">
  <span>Name:</span>
  <input type="text" bind:this={name} value={privilege ? privilege.name : ''} class="input" />
</label>

<label class="label">
  <span>Description:</span>
  <input
    type="text"
    bind:this={description}
    value={privilege ? privilege.description : ''}
    class="input"
  />
</label>

<label class="label">
  <span>Application:</span>
  <select class="select" bind:this={application}>
    <option selected={!privilege || !privilege.application} value>none</option>
    {#each applicationList as [name, uuid]}
      <option value={uuid} selected={privilege && privilege.application === uuid}>{name}</option>
    {/each}
  </select>
</label>

<button
  type="submit"
  class="btn variant-ghost-primary hover:variant-filled-primary"
  aria-label="You are on the save button"
  on:click={onSave}
>
  Save
</button>
<a href="/admin/authorization" class="btn variant-ghost-secondary hover:variant-filled-secondary">
  Cancel
</a>

<style>
  label {
    margin: 0.5em 0;
  }
</style>
