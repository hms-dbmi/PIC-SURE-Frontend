<script lang="ts">
  import Button from '#lib/ui/Button.svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { browser } from '$app/env';
  import { config } from '#lib/config/config.svelte.ts';
  import * as tos from '#lib/api/psama/tos.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { session } from '#lib/auth/session.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  import Loading from '#lib/ui/Loading.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import TermsPreview from '#lib/shell/TermsPreview.svelte';

  interface Props {
    required: boolean;
    onclose: () => void;
  }

  let { required, onclose }: Props = $props();
  let terms: Promise<string> = $state(Promise.resolve(''));

  function loadTermsHTML() {
    terms = tos.latest({ auth: 'none' });
  }

  function accept() {
    if (browser) {
      log(createLog('AUTH', 'tos.accept'));
      tos
        .accept()
        // Reloads the profile, which now records the acceptance.
        .then(() => session.login(session.token))
        .then(() => onclose())
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
      session.logout().then(() => {
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

  onMount(loadTermsHTML);
</script>

{#await terms}
  <Loading />
{:then termsHTML}
  <TermsPreview terms={termsHTML} />
  <footer class="modal-footer flex justify-end space-x-2 mt-6">
    {#if required}
      <Button variant="soft" data-testid="terms-reject" onclick={reject}>Reject</Button>
      <Button data-testid="terms-accept" onclick={accept}>Accept</Button>
    {:else}
      <Button variant="soft" data-testid="terms-close" onclick={onclose}>Close</Button>
    {/if}
  </footer>
{:catch}
  <ErrorAlert data-testid="terms-api-error"
    >Could not load terms of service. Please contact an administrator.</ErrorAlert
  >
  <Button variant="soft" data-testid="terms-close" onclick={onclose}>Close</Button>
{/await}
