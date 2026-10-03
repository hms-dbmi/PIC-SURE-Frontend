<script lang="ts">
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { browser } from '$app/env';
  import { config } from '#lib/configuration.svelte.ts';
  import * as api from '#lib/api.ts';
  import { Psama } from '#lib/paths.ts';
  import { toaster } from '#lib/toaster.ts';
  import { login, logout, user, isUserLoggedIn, getToken } from '#lib/stores/User.ts';
  import { log, createLog } from '#lib/logger.ts';

  import Loading from '#lib/components/Loading.svelte';
  import ErrorAlert from '#lib/components/ErrorAlert.svelte';
  import TermsPreview from '#lib/components/TermsPreview.svelte';

  let { modalOpen = $bindable(false) }: { modalOpen?: boolean } = $props();
  let terms: Promise<string> = $state(Promise.resolve(''));
  let enforceTerms: boolean = $derived(
    config.features.enforceTermsOfService && isUserLoggedIn() && !$user.acceptedTOS,
  );

  function loadTermsHTML() {
    terms = api.get(Psama.TOS + '/latest', {}, false);
  }

  function accept() {
    if (browser) {
      log(createLog('AUTH', 'tos.accept'));
      api
        .post(Psama.TOS + '/accept', {})
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
        data-testid="terms-reject-btn"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={reject}>Reject</button
      >
      <button
        type="button"
        data-testid="terms-accept-btn"
        class="btn preset-filled-primary-500"
        onclick={accept}>Accept</button
      >
    {:else}
      <button
        type="button"
        data-testid="terms-close-btn"
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
      data-testid="terms-close-btn"
      class="btn border preset-tonal-primary hover:preset-filled-primary-500"
      onclick={close}>Close</button
    >
  {/if}
{/await}
