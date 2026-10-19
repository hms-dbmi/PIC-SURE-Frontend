<script lang="ts">
  import { resolve } from '$app/paths';

  import type { Connection } from '#lib/auth/model/connection.ts';
  import * as admin from '#lib/admin/entities.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import AdminForm from '#lib/admin/forms/AdminForm.svelte';
  import TextField from '#lib/admin/forms/TextField.svelte';
  import { saveEntity } from '#lib/admin/forms/saveEntity.ts';

  import RequiredFieldsList from '#lib/admin/access/RequiredFieldsList.svelte';

  interface Props {
    connection?: Connection;
  }

  let { connection }: Props = $props();

  // Edited copies: they reset if the page hands the form another connection.
  let label = $derived(connection?.label || '');
  let id = $derived(connection?.id || '');
  let subPrefix = $derived(connection?.subPrefix || '');
  let requiredFields = $derived(connection?.requiredFields || '[]');

  function saveConnection() {
    const edited: Connection = { id, label, requiredFields, subPrefix };
    return saveEntity({
      isNew: !connection,
      noun: 'connection',
      name: label,
      save: () =>
        connection
          ? admin.connections.update({ ...edited, uuid: connection.uuid })
          : admin.connections.add(edited),
      redirect: resolve('/(picsure)/(authorized)/(admin)/admin/configuration'),
    });
  }
</script>

<p class="mb-3 text-center">
  For details on how to set up a Connection, please refer to the
  <a
    href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure/all-in-one-authentication-configuration#additional-authentication-configuration-option-s"
    target="_blank"
    class="anchor">PIC-SURE developer guide</a
  >.
</p>

<AdminForm
  entity="connection"
  uuid={connection?.uuid}
  disabled={!session.isTopAdmin}
  cancelHref={resolve('/(picsure)/(authorized)/(admin)/admin/configuration')}
  onsave={saveConnection}
>
  <TextField label="Label:" bind:value={label} required />
  <TextField label="ID:" bind:value={id} required />
  <TextField label="Sub Prefix:" bind:value={subPrefix} required />
  <RequiredFieldsList fields={requiredFields} onupdate={(json) => (requiredFields = json)} />
</AdminForm>
