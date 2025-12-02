<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { config } from '$lib/configuration.svelte';
  import * as api from '$lib/api';
  import { Psama } from '$lib/paths';
  import { toaster } from '$lib/toaster';
  import { login, logout, user, isLoggedIn, getToken } from '$lib/stores/User';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  let { modalOpen = $bindable(false) }: { modalOpen?: boolean } = $props();
  let terms: Promise<string> = $state(Promise.resolve(''));
  let enforceTerms: boolean = $derived(
    config.features.enforceTermsOfService && $isLoggedIn && !$user.acceptedTOS,
  );

  function loadTermsHTML() {
    terms = api.get(Psama.TOS + '/latest', {}, false);
  }

  function accept() {
    if (browser) {
      api
        .post(Psama.TOS + '/accept', {})
        .then(() => {
          const token = getToken();
          !!token &&
            login(token).then(() => {
              modalOpen = false;
            });
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
      logout().then(() => {
        if (config.branding.termsOfService.rejectionUrl) {
          window.location.href = config.branding.termsOfService.rejectionUrl;
        } else {
          goto('/login');
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
  <div id="terms-of-service">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html sanitizeHTML(termsHTML)}
  </div>
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
