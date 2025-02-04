<script lang="ts">
  import { goto } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  const toastStore = getToastStore();

  import type { Connection } from '$lib/models/Connection';

  export let connection: Connection = {
    uuid: '',
    id: '',
    label: '',
    subPrefix: '',
    requiredFields: '',
  };

  let label: string = connection.label;
  let id: string = connection.id;
  let subPrefix: string = connection.subPrefix;
  let requiredFields: string = connection.requiredFields;
  let validationError: boolean = false;

  function saveConnection() {
    try {
      JSON.parse(requiredFields);
      validationError = false;
    } catch (_) {
      validationError = true;
      return;
    }

    let newConnection: Connection = {
      ...connection,
      id,
      label,
      requiredFields,
      subPrefix,
    };
    try {
      if (connection) {
        // TODO: update connection
      } else {
        // TODO: new connection
      }
      toastStore.trigger({
        message: `Successfully saved ${newConnection ? 'new connection' : 'connection'} '${label}'`,
        background: 'variant-filled-success',
      });
      goto('/admin/configuration');
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message: `An error occured while saving ${
          newConnection ? 'new connection' : 'connection'
        } '${label}'`,
        background: 'variant-filled-error',
      });
    }
  }
</script>

<form on:submit|preventDefault={saveConnection}>
  <div class="grid gap-4 my-3">
    {#if connection.uuid}
      <label class="label">
        <span>UUID:</span>
        <input
          type="text"
          class="input"
          bind:value={connection.uuid}
          disabled={true}
          minlength="1"
          maxlength="255"
        />
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
    <label class="label required">
      <span>Required Fields:</span>
      <textarea required class="w-full input input-border" bind:value={requiredFields} />
    </label>
    {#if validationError}
      <aside class="alert variant-ghost-error mt-0">
        <div class="alert-message">
          <p>The provided JSON has a syntax error.</p>
        </div>
        <div class="alert-actions">
          <button on:click={() => (validationError = false)}>
            <i class="fa-solid fa-xmark"></i>
            <span class="sr-only">Close</span>
          </button>
        </div>
      </aside>
    {/if}
  </div>
  <div class="my-3">
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
