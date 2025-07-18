<script lang="ts">
  import { onMount } from 'svelte';
  import DOMPurify from 'dompurify';

  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { branding, features } from '$lib/configuration';
  import * as api from '$lib/api';
  import { Psama } from '$lib/paths';
  import { toaster } from '$lib/toaster';
  import { user, isLoggedIn } from '$lib/stores/User';

  import Loading from '$lib/components/Loading.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';

  let { modalOpen = $bindable(false) }: { modalOpen: boolean } = $props();

  let terms: Promise<string> = $state(Promise.resolve(''));

  function loadTermsHTML() {
    terms = api.get(Psama.TOS + '/latest');
  }

  function confirm() {
    modalOpen = false;
    api
      .post(Psama.TOS + '/accept', {})
      .then(() => {
        $user.acceptedTOS = true;
      })
      .catch((err) => {
        console.error(err);
        toaster.error({ description: 'An error occured while saving user terms acceptance.' });
      });
  }

  function cancel() {
    if (browser) {
      if (features.enforceTermsOfService) {
        if (branding.termsOfService.rejectionUrl) {
          window.location.href = branding.termsOfService.rejectionUrl;
        } else {
          goto('/');
        }
      }
    } else {
      throw new Error('Only browser supported');
    }
  }

  onMount(loadTermsHTML);
</script>

{#await terms}
  <Loading />
{:then termsHTML}
  <div id="terms-of-service">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html DOMPurify.sanitize(termsHTML)}
  </div>
  <footer class="modal-footer flex justify-end space-x-2 mt-6">
    {#if features.enforceTermsOfService && $isLoggedIn && !$user.acceptedTOS}
      <button
        type="button"
        data-testid="terms-reject-btn"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={cancel}>Reject</button
      >
      <button
        type="button"
        data-testid="terms-accept-btn"
        class="btn preset-filled-primary-500"
        onclick={confirm}>Accept</button
      >
    {:else}
      <button
        type="button"
        data-testid="terms-close-btn"
        class="btn border preset-tonal-primary hover:preset-filled-primary-500"
        onclick={() => (modalOpen = false)}>Close</button
      >
    {/if}
  </footer>
{:catch}
  <ErrorAlert>Could not load terms of service. Please contact an administrator.</ErrorAlert>
{/await}
