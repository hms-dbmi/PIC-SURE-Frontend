<script lang="ts">
  import { post } from '$lib/api';
  import { Psama } from '$lib/paths';
  import { log, createLog } from '$lib/logger';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Loading from '$lib/components/Loading.svelte';
  import Turnstile from '$lib/components/Turnstile.svelte';

  interface PublicKey {
    apiKey: string;
    uuid: string;
    displayPrefix: string;
    keyType: string;
    expiresAt: string;
  }

  type View = 'idle' | 'form' | 'revealed' | 'error';

  // deployment capability from branding config; the backend independently enforces its own flag
  let { enabled = false }: { enabled?: boolean } = $props();

  // when a Turnstile sitekey is configured the widget gates submission; empty keeps the
  // ungated flow (valid against a PSAMA running captcha.provider=disabled)
  const turnstileSiteKey: string = import.meta.env?.VITE_TURNSTILE_SITE_KEY || '';

  let view: View = $state('idle');
  let name = $state('');
  let email = $state('');
  let captchaToken: string | null = $state(null);
  let captchaFailed = $state(false);
  let submitting = $state(false);
  let publicKey: PublicKey | undefined = $state();
  let errorMessage = $state('');
  let firstField: HTMLInputElement | undefined = $state();
  let warning: HTMLElement | undefined = $state();

  // moving between states unmounts the focused button; land focus somewhere meaningful,
  // especially on the see-once warning so screen readers announce it
  $effect(() => {
    if (view === 'form') firstField?.focus();
    else if (view === 'revealed') warning?.focus();
  });

  let expires = $derived(
    publicKey
      ? new Date(publicKey.expiresAt).toLocaleString(undefined, {
          dateStyle: 'long',
          timeStyle: 'short',
        })
      : '',
  );

  function extractErrorMessage(err: unknown): string {
    const fallback = 'Unable to generate a public access key. Please try again later.';
    const message = (err as { body?: { message?: string } })?.body?.message;
    if (!message) return fallback;
    try {
      const parsed = JSON.parse(message);
      return typeof parsed === 'string' ? parsed : parsed?.message || fallback;
    } catch {
      // Non-JSON bodies are server/proxy error pages (HTML documents, stack
      // traces), not messages written for users
      return message.trimStart().startsWith('<') || message.length > 200 ? fallback : message;
    }
  }

  // tokens are single-use and expire after 5 minutes: every entry into the form view
  // remounts the widget so a fresh token is issued
  function openForm() {
    captchaToken = null;
    captchaFailed = false;
    view = 'form';
  }

  async function generateKey(event: SubmitEvent) {
    event.preventDefault();
    submitting = true;
    log(createLog('ACTION', 'api.public_key.request'));
    try {
      const response: PublicKey = await post(
        Psama.Open.ApiKey,
        { captchaToken, name: name.trim() || null, email: email.trim() || null },
        undefined,
        false,
      );
      if (!response?.apiKey || !response?.uuid) {
        // api.ts treats 422 and empty bodies as success; never enter 'revealed' without a key
        throw { body: { message: '' } };
      }
      publicKey = response;
      view = 'revealed';
      log(
        createLog('ACTION', 'api.public_key.success', {
          uuid: response.uuid,
          displayPrefix: response.displayPrefix,
        }),
      );
    } catch (err) {
      errorMessage = extractErrorMessage(err);
      view = 'error';
      log(createLog('ACTION', 'api.public_key.failure', { error: errorMessage }));
    } finally {
      submitting = false;
    }
  }
</script>

<div
  data-testid="public-access-key"
  class="card border border-surface-200 p-6 min-h-80 flex flex-col"
>
  <header class="flex items-center gap-4 mb-4">
    <i class="fa-solid fa-globe text-3xl text-primary-500"></i>
    <div>
      <div class="text-lg font-bold">Public Access Key</div>
      <div class="text-sm">No account required</div>
    </div>
  </header>

  {#if view === 'idle'}
    <p class="mx-0">
      A public key grants access to open resources, including aggregate counts for feasibility
      assessments.
    </p>
    {#if enabled}
      <button class="btn preset-filled-primary-500 my-auto mx-auto" onclick={openForm}>
        Request Public Key
      </button>
    {:else}
      <p data-testid="public-key-unavailable" class="mx-0 my-auto text-center">
        Public access keys are not available on this deployment. Please log in for authorized
        access.
      </p>
    {/if}
  {:else if view === 'form'}
    <form class="flex flex-col gap-4 flex-1" onsubmit={generateKey}>
      <div class="label">
        <label for="public-key-name">Name <span class="text-sm">(optional)</span></label>
        <input
          id="public-key-name"
          class="input"
          type="text"
          name="name"
          maxlength="255"
          placeholder="Jane Doe"
          bind:value={name}
          bind:this={firstField}
          disabled={submitting}
        />
      </div>
      <div class="label">
        <label for="public-key-email">Email <span class="text-sm">(optional)</span></label>
        <input
          id="public-key-email"
          class="input"
          type="email"
          name="email"
          maxlength="255"
          placeholder="you@example.org"
          pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          title="Enter an email address like you@example.org"
          aria-describedby="public-key-email-hint"
          bind:value={email}
          disabled={submitting}
        />
        <span id="public-key-email-hint" class="text-sm">
          Only used to contact you if there is a problem with your key. No account is created.
        </span>
      </div>
      {#if turnstileSiteKey}
        <div class="mx-auto">
          <Turnstile
            sitekey={turnstileSiteKey}
            onToken={(token) => (captchaToken = token)}
            onError={() => (captchaFailed = true)}
          />
        </div>
        {#if captchaFailed}
          <p data-testid="public-key-captcha-failed" role="alert" class="mx-0 text-center text-sm">
            The security check could not be loaded. Check your connection and reload the page to try
            again.
          </p>
        {:else if !captchaToken}
          <span id="public-key-captcha-hint" class="sr-only">
            Complete the security check to enable key generation.
          </span>
        {/if}
      {/if}
      <div class="flex gap-4 justify-center mt-auto">
        <button
          type="submit"
          class="btn preset-filled-primary-500"
          disabled={submitting || (!!turnstileSiteKey && !captchaToken)}
          aria-describedby={turnstileSiteKey && !captchaToken && !captchaFailed
            ? 'public-key-captcha-hint'
            : undefined}
        >
          {#if submitting}
            <Loading ring size="micro" label="Generating" />
          {:else}
            Generate Key
          {/if}
        </button>
        <button
          type="button"
          class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
          onclick={() => (view = 'idle')}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  {:else if view === 'revealed' && publicKey}
    <aside
      data-testid="public-key-warning"
      role="alert"
      tabindex="-1"
      bind:this={warning}
      class="card preset-tonal-warning border border-warning-500 flex items-center gap-4 py-2 px-3 mb-4"
    >
      <i class="fa-solid fa-triangle-exclamation text-3xl" aria-hidden="true"></i>
      <p class="m-0 font-bold">
        This key is shown only once and cannot be recovered. Copy it now and store it somewhere
        safe.
      </p>
    </aside>
    <div class="flex items-center gap-2">
      <code data-testid="public-key-value" class="font-mono text-sm break-all grow"
        >{publicKey.apiKey}</code
      >
      <CopyButton
        itemToCopy={publicKey.apiKey}
        class="preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
      />
    </div>
    <div class="mt-4">
      <span class="font-bold">Expires:</span>
      <span data-testid="public-key-expires">{expires}</span>
    </div>
  {:else if view === 'error'}
    <!-- ErrorAlert has no live region of its own; announce the async failure -->
    <div role="alert">
      <ErrorAlert color="warning">{errorMessage}</ErrorAlert>
    </div>
    <button class="btn preset-filled-primary-500 my-auto mx-auto" onclick={openForm}>
      Try Again
    </button>
  {/if}
</div>
