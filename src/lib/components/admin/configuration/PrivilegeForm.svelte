<script lang="ts">
  import { goto } from '$app/navigation';

  import type { Privilege } from '$lib/models/Privilege';
  import { addPrivilege, updatePrivilege } from '$lib/stores/Privileges';
  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';

  interface Props {
    privilege?: Privilege | undefined;
    applicationList: string[][];
  }

  let { privilege = undefined, applicationList }: Props = $props();

  let name = $state(privilege ? privilege.name : '');
  let description = $state(privilege ? privilege.description : '');
  let application = $state(privilege ? privilege.application : '');

  async function savePrivilege(event: Event) {
    event.preventDefault();
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
      toaster.success({
        title: `Successfully saved ${newPrivilege && 'new '}privilege '${name}'`,
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while saving ${newPrivilege && 'new '}privilege '${name}'`,
      });
    }
  }
</script>

<form onsubmit={savePrivilege}>
  <fieldset data-testid="privilege-form" class="grid gap-4 my-3" disabled={!$isTopAdmin}>
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
      <select bind:value={application} required>
        <option value="" disabled>Select an application</option>
        {#each applicationList as [name, uuid]}
          <option value={uuid}>{name}</option>
        {/each}
      </select>
    </label>

    <div class="mt-2">
      <button
        type="submit"
        data-testid="privilege-save-btn"
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      >
        Save
      </button>
      <a
        href="/admin/configuration"
        data-testid="privilege-cancel-btn"
        class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
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
