<script lang="ts">
  import type { Role } from '$lib/models/Role';

  export let role: Role | undefined = undefined;
  export let privilegeList: string[][];
  export let onSave = () => {};

  let name;
  let description;
  let privileges: HTMLElement[] = [];
</script>

<label class="label">
  <span>Name:</span>
  <input type="text" bind:this={name} value={role ? role.name : ''} class="input" />
</label>

<label class="label">
  <span>Description:</span>
  <input type="text" bind:this={description} value={role ? role.description : ''} class="input" />
</label>

<fieldset data-testid="privilege-checkboxes">
  <legend>Privileges:</legend>
  {#each privilegeList as [name, uuid], index}
    <label class="flex items-center space-x-2">
      <input
        class="checkbox"
        type="checkbox"
        bind:this={privileges[index]}
        value={uuid}
        checked={role && role.privileges.includes(uuid)}
      />
      <p>{name}</p>
    </label>
  {/each}
</fieldset>

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
  label,
  fieldset {
    margin: 0.5em 0;
  }
  fieldset label {
    margin: 0;
  }
</style>
