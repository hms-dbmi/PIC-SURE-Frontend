<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { browser } from '$app/env';
  import { config } from '#lib/config/config.svelte.ts';
  import * as tos from '#lib/api/psama/tos.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { login, logout, user, isUserLoggedIn, getToken } from '#lib/auth/User.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import Loading from '#lib/ui/Loading.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import TermsPreview from '#lib/shell/TermsPreview.svelte';

  let { modalOpen = $bindable(false) }: { modalOpen?: boolean } = $props();
  let terms: Promise<string> = $state(Promise.resolve(''));
  let enforceTerms: boolean = $derived(
    config.features.enforceTermsOfService && isUserLoggedIn() && !$user.acceptedTOS,
  );

  function loadTermsHTML() {
    terms = tos.latest({ auth: 'none' });
  }

  function accept() {
    if (browser) {
      log(createLog('AUTH', 'tos.accept'));
      tos
        .accept()
        .then(() => {
          const token = getToken();
          if (token) {
            login(token).then(() => {
              modalOpen = false;
            });
          }
        })
        .catch((err) => {
          console.error(err);
          toaster.error({ description: 'An error occured while saving user terms acceptance.' });
        });
    } else {
      throw new Error('Only browser supported');
    }
  }

  function reject() {
    if (browser) {
      log(createLog('AUTH', 'tos.reject'));
      logout().then(() => {
        if (config.branding.termsOfService.rejectionUrl) {
          window.location.href = config.branding.termsOfService.rejectionUrl;
        } else {
          goto(resolve('login'));
        }
      });
    } else {
      throw new Error('Only browser supported');
    }
  }

  function close() {
    if (modalOpen !== undefined) {
      modalOpen = false;
    }
  }

  onMount(loadTermsHTML);
</script>

{#await terms}
  <Loading />
{:then termsHTML}
  <TermsPreview terms={termsHTML} />
  <footer class="modal-footer flex justify-end space-x-2 mt-6">
    {#if enforceTerms}
      <button
        type="button"
        data-testid="terms-reject"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={reject}>Reject</button
      >
      <button
        type="button"
        data-testid="terms-accept"
        class="btn preset-filled-primary-500"
        onclick={accept}>Accept</button
      >
    {:else}
      <button
        type="button"
        data-testid="terms-close"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={close}>Close</button
      >
    {/if}
  </footer>
{:catch}
  <ErrorAlert data-testid="terms-api-error"
    >Could not load terms of service. Please contact an administrator.</ErrorAlert
  >
  {#if modalOpen !== undefined}
    <button
      type="button"
      data-testid="terms-close"
      class="btn border preset-tonal-primary hover:preset-filled-primary-500"
      onclick={close}>Close</button
    >
  {/if}
{/await}
