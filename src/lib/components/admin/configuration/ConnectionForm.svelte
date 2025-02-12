<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import type { Connection } from '$lib/models/Connection';
  import { addConnection, updateConnection } from '$lib/stores/Connections';

  export let connection: Connection | undefined = undefined;

  let label: string = connection?.label || '';
  let id: string = connection?.id || '';
  let subPrefix: string = connection?.subPrefix || '';
  let requiredFields: string = connection?.requiredFields || '';
  let validationError: string = '';

  async function saveConnection() {
    try {
      requiredFields !== '' && JSON.parse(requiredFields);
      validationError = '';
    } catch (_) {
      validationError = 'The provided JSON has a syntax error.';
      return;
    }

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

<form on:submit|preventDefault={saveConnection} class="grid gap-4 my-3">
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

  <label class="label">
    <span>Required Fields:</span>
    <textarea class="w-full input input-border" bind:value={requiredFields} />
  </label>

  {#if validationError}
    <aside data-testid="validation-error" class="alert variant-ghost-error">
      <div class="alert-message">
        <p>{validationError}</p>
      </div>
      <div class="alert-actions">
        <button on:click={() => (validationError = '')}>
          <i class="fa-solid fa-xmark"></i>
          <span class="sr-only">Close</span>
        </button>
      </div>
    </aside>
  {/if}

  <div>
    <button type="submit" class="btn variant-ghost-primary hover:variant-filled-primary">
      Save
    </button>
    <a
      href="/admin/configuration"
      class="btn variant-ghost-secondary hover:variant-filled-secondary"
    >
      Cancel
    </a>
  </div>
</form>
