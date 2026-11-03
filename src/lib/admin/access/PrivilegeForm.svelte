<script lang="ts">
  import { resolve } from '$app/paths';

  import type { Privilege } from '#lib/auth/model/privilege.ts';
  import * as admin from '#lib/admin/entities.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import AdminForm from '#lib/admin/forms/AdminForm.svelte';
  import TextField from '#lib/admin/forms/TextField.svelte';
  import { saveEntity } from '#lib/admin/forms/saveEntity.ts';

  interface Props {
    privilege?: Privilege;
    applicationList: string[][];
  }

  let { privilege, applicationList }: Props = $props();

  // Edited copies: they reset if the page hands the form another privilege.
  let name = $derived(privilege?.name ?? '');
  let description = $derived(privilege?.description ?? '');
  let application = $derived(privilege?.application ?? '');

  function savePrivilege() {
    const edited: Privilege = { name, description, application };
    return saveEntity({
      isNew: !privilege,
      noun: 'privilege',
      name,
      save: () =>
        privilege
          ? admin.privileges.update({ ...edited, uuid: privilege.uuid })
          : admin.privileges.add(edited),
      redirect: resolve('/(picsure)/(authorized)/(admin)/admin/configuration'),
    });
  }
</script>

<div class="privilege-form">
  <AdminForm
    entity="privilege"
    uuid={privilege?.uuid}
    disabled={!session.isTopAdmin}
    cancelHref={resolve('/(picsure)/(authorized)/(admin)/admin/configuration')}
    onsave={savePrivilege}
  >
    <TextField label="Name:" bind:value={name} required />
    <TextField label="Description:" bind:value={description} required />

    <label class="label required">
      <span>Application:</span>
      <select bind:value={application} required>
        <option value="" disabled>Select an application</option>
        {#each applicationList as [name, uuid] (uuid)}
          <option value={uuid}>{name}</option>
        {/each}
      </select>
    </label>
  </AdminForm>
</div>

<style>
  .privilege-form :global(label) {
    margin: 0.5em 0;
  }
</style>
