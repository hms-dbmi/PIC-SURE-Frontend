<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  import { isTopAdmin } from '$lib/stores/User';
  import { mintPlatformKey } from '$lib/stores/ApiKeys';
  import {
    extractApiError,
    formatInstant,
    toPlatformKeyRequest,
    type MintedPlatformKey,
  } from '$lib/models/ApiKey';

  let formOpen = $state(false);
  let revealOpen = $state(false);
  let name = $state('');
  let email = $state('');
  let expiryDate = $state('');
  let mintError = $state('');
  let isSubmitting = $state(false);
  let minted: MintedPlatformKey | null = $state(null);

  const minExpiryDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  })();

  function resetForm() {
    name = '';
    email = '';
    expiryDate = '';
    mintError = '';
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    mintError = '';
    try {
      minted = await mintPlatformKey(toPlatformKeyRequest(name, email, expiryDate));
      formOpen = false;
      revealOpen = true;
      resetForm();
    } catch (error) {
      mintError = extractApiError(error);
    } finally {
      isSubmitting = false;
    }
  }

  function acknowledge() {
    revealOpen = false;
    minted = null;
  }
</script>

<Modal
  bind:open={formOpen}
  data-testid="mint-platform-key"
  title="Mint Platform API Key"
  width="w-full max-w-xl"
  disabled={!$isTopAdmin}
  onclose={resetForm}
  triggerBase="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
>
  {#snippet trigger()}+ Mint Platform Key{/snippet}
  <form onsubmit={submit} class="mt-4">
    {#if mintError}
      <ErrorAlert title="Unable to mint key" data-testid="mint-key-error">
        <p>{mintError}</p>
      </ErrorAlert>
    {/if}
    <fieldset class="grid gap-4 my-3" disabled={isSubmitting}>
      <label class="label required">
        <span>Name:</span>
        <input type="text" bind:value={name} class="input" required maxlength="255" />
      </label>
      <label class="label required">
        <span>Email:</span>
        <input type="email" bind:value={email} class="input" required maxlength="255" />
      </label>
      <label class="label">
        <span>Expiration date (optional, expires at 00:00 UTC):</span>
        <input type="date" bind:value={expiryDate} class="input" min={minExpiryDate} />
      </label>
    </fieldset>
    <footer class="flex justify-end space-x-2 mt-6">
      <button
        type="button"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={() => {
          formOpen = false;
          resetForm();
        }}
      >
        Cancel
      </button>
      <button type="submit" class="btn preset-filled-primary-500" disabled={isSubmitting}>
        {isSubmitting ? 'Minting…' : 'Mint Key'}
      </button>
    </footer>
  </form>
</Modal>

{#if minted}
  <Modal
    bind:open={revealOpen}
    data-testid="mint-key-reveal"
    title="Platform API Key Created"
    width="w-full max-w-xl"
    closeable={false}
  >
    <div
      role="alert"
      data-testid="minted-key-warning"
      class="card preset-tonal-warning border border-warning-500 p-3 my-4 font-bold"
    >
      This key is shown only once and cannot be recovered. Copy it now and store it securely.
    </div>
    <div class="flex items-center gap-2 my-4">
      <code data-testid="minted-api-key" class="code font-mono break-all p-2 grow"
        >{minted.apiKey}</code
      >
      <CopyButton
        itemToCopy={minted.apiKey}
        data-testid="copy-minted-api-key"
        class="preset-filled-primary-500"
      />
    </div>
    <p class="my-2">
      Key prefix: <code class="code">picsure_{minted.displayPrefix}…</code>
      &middot; Expires: {formatInstant(minted.expiresAt, 'Never')}
    </p>
    <footer class="flex justify-end mt-6">
      <button
        type="button"
        data-testid="acknowledge-minted-key"
        class="btn preset-filled-primary-500"
        onclick={acknowledge}
      >
        I've copied the key
      </button>
    </footer>
  </Modal>
{/if}
