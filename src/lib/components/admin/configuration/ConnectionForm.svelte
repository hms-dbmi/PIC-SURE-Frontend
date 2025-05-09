<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();
  import { isTopAdmin } from '$lib/stores/User';

  import type { Connection } from '$lib/models/Connection';
  import { addConnection, updateConnection } from '$lib/stores/Connections';

  import RequiredFieldsList from './RequiredFieldsList.svelte';
  import ConfigForm from '$lib/components/ConfigForm.svelte';
  export let connection: Connection | undefined = undefined;

  let label: string = connection?.label || '';
  let id: string = connection?.id || '';
  let subPrefix: string = connection?.subPrefix || '';
  let requiredFields: string = connection?.requiredFields || '[]';

  type JSONEvent = { detail: { json: string } };
  function updateRequiredFields(event: JSONEvent) {
    requiredFields = event.detail.json;
  }

  async function saveConnection() {
    let newConnection: Connection = {
      id,
      label,
      requiredFields,
      subPrefix,
    };
    try {
      if (!isTopAdmin) throw new Error('You are not authorized to save a connection. Please contact your administrator.');
      if (connection) {
        newConnection = { ...newConnection, uuid: connection.uuid };
        await updateConnection(newConnection);
      } else {
        await addConnection(newConnection);
      }
      toastStore.trigger({
        message: `Successfully saved ${newConnection && 'new '}connection '${label}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${newConnection && 'new '}connection '${label}'`,
        background: 'variant-filled-error',
      });
    }
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

<ConfigForm id="connection-form" onSubmit={saveConnection} class="grid gap-4 my-3" disabled={!isTopAdmin}>
  {#if connection?.uuid}
    <label class="label">
      <span>UUID:</span>
      <input type="text" class="input" value={connection?.uuid} disabled={true} />
    </label>
  {/if}

  <label class="label required">
    <span>Label:</span>
    <input type="text" bind:value={label} class="input" required minlength="1" maxlength="255" />
  </label>

  <label class="label required">
    <span>ID:</span>
    <input type="text" bind:value={id} class="input" required minlength="1" maxlength="255" />
  </label>

  <label class="label required">
    <span>Sub Prefix:</span>
    <input
      type="text"
      bind:value={subPrefix}
      class="input"
      required
      minlength="1"
      maxlength="255"
    />
  </label>

  <RequiredFieldsList fields={requiredFields} on:update={updateRequiredFields} />

  <div>
    <button
      type="submit"
      data-testid="connection-save-btn"
      class="btn variant-ghost-primary hover:variant-filled-primary"
    >
      Save
    </button>
    <a
      href="/admin/configuration"
      data-testid="connection-cancel-btn"
      class="btn variant-ghost-secondary hover:variant-filled-secondary"
    >
      Cancel
    </a>
  </div>
</ConfigForm>
