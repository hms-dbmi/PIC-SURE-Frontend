<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  import type { Privilege } from '#lib/auth/model/privilege.ts';
  import { addPrivilege, updatePrivilege } from '#lib/admin/access/Privileges.ts';
  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';

  interface Props {
    privilege?: Privilege | undefined;
    applicationList: string[][];
  }

  let { privilege = undefined, applicationList }: Props = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(privilege ? privilege.name : '');
  // svelte-ignore state_referenced_locally
  let description = $state(privilege ? privilege.description : '');
  // svelte-ignore state_referenced_locally
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
        title: `Successfully saved ${privilege ? '' : 'new '}privilege '${name}'`,
      });
      goto(resolve('admin/configuration'));
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occurred while saving ${privilege ? '' : 'new '}privilege '${name}'`,
      });
    }
  }
</script>

<form onsubmit={savePrivilege}>
  <fieldset data-testid="admin-privilege-form" class="grid gap-4 my-3" disabled={!$isTopAdmin}>
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
      <Button variant="tonal" type="submit" data-testid="admin-privilege-save">Save</Button>
      <Button
        variant="tonal-secondary"
        href={resolve('admin/configuration')}
        data-testid="admin-privilege-cancel"
      >
        Cancel
      </Button>
    </div>
  </fieldset>
</form>

<style>
  label {
    margin: 0.5em 0;
  }
</style>
