<script lang="ts">
  import { goto } from '$app/navigation';
  const toastStore = getToastStore();

  import type { Privilege } from '$lib/models/Privilege';
  import { addPrivilege, updatePrivilege } from '$lib/stores/Privileges';
  import { isTopAdmin } from '$lib/stores/User';

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
      toastStore.trigger({
        message: `Successfully saved ${newPrivilege && 'new '}privilege '${name}'`,
        background: 'preset-filled-success-500',
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newPrivilege && 'new '}privilege '${name}'`,
        background: 'preset-filled-error-500',
      });
    }
  }
</script>

<form onsubmit={savePrivilege} class="grid gap-4 my-3">
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
