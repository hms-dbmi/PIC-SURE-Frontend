<script lang="ts">
  import { buttonClass } from '#lib/ui/button.ts';
  import Button from '#lib/ui/Button.svelte';
  import { toaster } from '#lib/ui/toaster.ts';
  import { debounce } from '#lib/utils/debounce.ts';
  import CopyButton from '#lib/ui/CopyButton.svelte';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
  import { session } from '#lib/auth/session.svelte.ts';
  import { getTokenExpiration, getTokenExpirationAsDate } from '#lib/auth/token.ts';
  import Loading from '#lib/ui/Loading.svelte';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { cardClass } from '#lib/ui/surface.ts';

  const defaultRefreshText = 'Refresh';
  const placeHolderToken =
    '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  let account = $derived(session.user.email || 'There was an error retrieving your account.');
  let revealed = $state(false);
  let refreshButtonDisabled = $state(false);
  let refreshPromise: Promise<string> = $state(Promise.resolve(defaultRefreshText));

  let token = $derived(session.user.token);
  let expires = $derived(token ? extractExperationDate(token) : 0);
  let badge = $derived(expires && checkIfExpired());

  function checkIfExpired() {
    if (!expires || expires === 0) {
      return 'unknown';
    }
    const daysLeftOnToken = Math.floor((expires - Date.now()) / (1000 * 60 * 60 * 24));
    if (expires < Date.now()) {
      return 'expired';
    } else if (daysLeftOnToken < 7) {
      return 'expiring soon';
    } else {
      return 'valid for ' + daysLeftOnToken + ' more days';
    }
  }

  function extractExperationDate(token: string) {
    if (!token) return 0;
    try {
      return getTokenExpiration(token);
    } catch (error) {
      console.error(error);
      toaster.error({
        title:
          'An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.',
      });
      return 0; //TODO: Handle errors
    }
  }

  function refreshToken() {
    log(createLog('ACTION', 'token.refresh'));
    refreshButtonDisabled = true;
    refreshPromise = session
      .refreshLongTermToken()
      .then(() => 'Refreshed!')
      .catch((e) => {
        console.log('Error: ', e);
        toaster.error({
          title:
            'An error occured while refreshing your token. Please try again later. If this problem persists, please contact an administrator.',
        });
        return 'Error';
      })
      .finally(
        debounce(() => {
          refreshPromise = Promise.resolve('Refresh');
          refreshButtonDisabled = false;
        }, 5000),
      );
  }

  function revealToken() {
    revealed = !revealed;
    log(createLog('ACTION', 'token.reveal', { revealed }));
  }
</script>

<div id="user-token-container">
  {#await session.loadUser(true, true)}
    <Loading ring size="medium" />
  {:then}
    <div id="user-token" class="{cardClass} bg-surface-50-950">
      <header class="card-header flex w-full items-center gap-4">
        <i class="fa-solid fa-user-shield text-3xl text-success-500"></i>
        <div>
          <h4 class="my-0">Personal Access Token</h4>
          <div class="text-sm">Login confirmed</div>
        </div>
      </header>
      <section class="p-4 grid grid-cols-2 gap-y-2 items-center">
        <label for="user-token-account">Account:</label>
        <span id="user-token-account" class="w-full">{account}</span>
        <label for="user-token-value">Token:</label>
        <div id="user-token-value">{revealed ? token : placeHolderToken}</div>
        <label for="user-token-expires">Expires:</label>
        <div>
          <span id="user-token-expires" class="w-1/3 mr-2"
            >{getTokenExpirationAsDate(token || '')
              ?.toString()
              ?.substring(0, 24)}</span
          >
          {#if badge}
            <span
              id="user-token-expires-badge"
              class="badge {badge}"
              data-testid="user-token-expires">{badge.toUpperCase()}</span
            >
          {/if}
        </div>
      </section>
      <footer class="card-footer mt-2">
        <CopyButton
          itemToCopy={token || ''}
          oncopy={() => log(createLog('ACTION', 'token.copy'))}
          variant="tonal"
        />
        <ConfirmDialog
          data-testid="user-token-refresh"
          title="Please Confirm"
          onconfirm={refreshToken}
          disabled={refreshButtonDisabled}
          triggerClass={buttonClass('tonal')}
        >
          {#snippet trigger()}
            {#await refreshPromise}
              <Loading ring size="micro" label="Refreshing" />
            {:then text}
              {text}
            {/await}
          {/snippet}
          Are you sure you wish to invalidate your old token and create a new one?
        </ConfirmDialog>
        <Button variant="tonal" data-testid="user-token-reveal" onclick={revealToken}
          >{revealed ? 'Hide' : 'Reveal'}</Button
        >
      </footer>
    </div>
  {:catch}
    <ErrorAlert color="warning">
      An error occured while to retrieving your account. If this problem persists, please contact an
      administrator.
    </ErrorAlert>
  {/await}
</div>

<style>
  #user-token-container {
    display: flex;
    justify-content: center;
    width: 55rem;
    max-width: 100%;
  }
  #user-token-container #user-token {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  #user-token-container #user-token section {
    width: 100%;
    max-width: 53rem;
    grid-template-columns: min-content auto;
  }
  #user-token-container #user-token section label {
    text-align: right;
    clear: both;
    float: left;
    margin-right: 15px;
  }
</style>
