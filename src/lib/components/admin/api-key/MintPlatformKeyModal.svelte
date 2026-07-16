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
    type PlatformKeyExpiry,
  } from '$lib/models/ApiKey';

  let open = $state(false);
  let name = $state('');
  let email = $state('');
  let expiryMode: PlatformKeyExpiry['mode'] = $state('default');
  let expiryDate = $state('');
  let mintError = $state('');
  let isSubmitting = $state(false);
  // once set, the same modal swaps from the form to the see-once reveal; keeping it a single
  // Modal instance avoids a second dialog whose layer collides with the closing form dialog
  let minted: MintedPlatformKey | null = $state(null);

  const minExpiryDate = (() => {
    // keys expire at 00:00 UTC, so the earliest selectable day must be computed in UTC too
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  })();

  function clearState() {
    name = '';
    email = '';
    expiryMode = 'default';
    expiryDate = '';
    mintError = '';
    minted = null;
  }

  // Done/Cancel close explicitly and clear here; this backstop covers escape and click-outside
  // (which don't route through those buttons) so the plaintext key never lingers after any close
  $effect(() => {
    if (!open) clearState();
  });

  function close() {
    open = false;
    clearState();
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    isSubmitting = true;
    mintError = '';
    const expiry: PlatformKeyExpiry =
      expiryMode === 'date' ? { mode: 'date', date: expiryDate } : { mode: expiryMode };
    try {
      minted = await mintPlatformKey(toPlatformKeyRequest(name, email, expiry));
    } catch (error) {
      mintError = extractApiError(error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<Modal
  bind:open
  data-testid="mint-platform-key"
  title={minted ? 'Platform API Key Created' : 'Mint Platform API Key'}
  width="w-full max-w-xl"
  disabled={!$isTopAdmin}
  closeable={!minted && !isSubmitting}
  triggerBase="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
>
  {#snippet trigger()}+ Mint Platform Key{/snippet}
  {#if minted}
    <div data-testid="mint-key-reveal">
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
          data-testid="done-minted-key"
          class="btn preset-filled-primary-500"
          onclick={close}
        >
          Done
        </button>
      </footer>
    </div>
  {:else}
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
        <div class="grid gap-2" role="radiogroup" aria-label="Expiration">
          <span class="font-semibold">Expiration:</span>
          <label class="flex items-center gap-2">
            <input type="radio" class="radio" bind:group={expiryMode} value="default" />
            <span>Default (server policy)</span>
          </label>
          <label class="flex items-center gap-2">
            <input type="radio" class="radio" bind:group={expiryMode} value="date" />
            <span>Custom date</span>
          </label>
          {#if expiryMode === 'date'}
            <label class="label ml-7">
              <span>Expiration date (expires at 00:00 UTC):</span>
              <input
                type="date"
                bind:value={expiryDate}
                class="input"
                min={minExpiryDate}
                required
              />
            </label>
          {/if}
          <label class="flex items-center gap-2">
            <input
              type="radio"
              class="radio"
              bind:group={expiryMode}
              value="never"
              data-testid="expiry-never"
            />
            <span>
              Never expires
              <span class="text-warning-600 font-semibold">— not recommended</span>
            </span>
          </label>
        </div>
      </fieldset>
      <footer class="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          class="btn border preset-tonal-primary hover:preset-filled-primary-500"
          onclick={close}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" class="btn preset-filled-primary-500" disabled={isSubmitting}>
          {isSubmitting ? 'Minting…' : 'Mint Key'}
        </button>
      </footer>
    </form>
  {/if}
</Modal>
