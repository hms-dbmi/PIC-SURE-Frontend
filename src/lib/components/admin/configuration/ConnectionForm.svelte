<script lang="ts">
  import { goto } from '$app/navigation';

  import type { Connection } from '$lib/models/Connection';
  import { addConnection, updateConnection } from '$lib/stores/Connections';
  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';

  import RequiredFieldsList from '$lib/components/admin/configuration/RequiredFieldsList.svelte';

  interface Props {
    connection?: Connection | undefined;
  }

  let { connection = undefined }: Props = $props();

  let label: string = $state(connection?.label || '');
  let id: string = $state(connection?.id || '');
  let subPrefix: string = $state(connection?.subPrefix || '');
  let requiredFields: string = $state(connection?.requiredFields || '[]');

  function updateRequiredFields(json: string) {
    requiredFields = json;
  }

  async function saveConnection(event: Event) {
    event.preventDefault();
    let newConnection: Connection = {
      id,
      label,
      requiredFields,
      subPrefix,
    };
    try {
      if (connection) {
        newConnection = { ...newConnection, uuid: connection.uuid };
        await updateConnection(newConnection);
      } else {
        await addConnection(newConnection);
      }
      toaster.success({
        title: `Successfully saved ${newConnection && 'new '}connection '${label}'`,
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toaster.error({
        title: `An error occured while saving ${newConnection && 'new '}connection '${label}'`,
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

<form onsubmit={saveConnection}>
  <fieldset data-testid="connection-form" class="grid gap-4 my-3" disabled={!$isTopAdmin}>
    {#if connection?.uuid}
      <label class="label">
        <span>UUID:</span>
        <input type="text" class="input" value={connection?.uuid} readonly={true} />
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

    <RequiredFieldsList fields={requiredFields} onupdate={updateRequiredFields} />

    <div class="mt-2">
      <button
        type="submit"
        data-testid="connection-save-btn"
        class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      >
        Save
      </button>
      <a
        href="/admin/configuration"
        data-testid="connection-cancel-btn"
        class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500"
      >
        Cancel
      </a>
    </div>
  </fieldset>
</form>
