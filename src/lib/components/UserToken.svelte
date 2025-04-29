<script lang="ts">
  import { toaster } from '$lib/toaster';
  import { debounce } from '$lib/utilities/Forms';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import {
    user,
    getUser,
    getTokenExpiration,
    getTokenExpirationAsDate,
    refreshLongTermToken as refresh,
  } from '$lib/stores/User';
  import Loading from './Loading.svelte';

  const defaultRefreshText = 'Refresh';
  const placeHolderToken =
    '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  let account = $state($user?.email || 'There was an error retrieving your account.');
  let revealed = $state(false);
  let refreshButtonDisabled = $state(false);
  let refreshPromise: Promise<string> = $state(Promise.resolve(defaultRefreshText));

  let token = $derived($user?.token);
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
    refreshButtonDisabled = true;
    refreshPromise = refresh()
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
  }
</script>

<div id="user-token-container">
  {#await getUser(true, true)}
    <Loading ring size="medium" />
  {:then}
    <div id="user-token" class="card preset-filled-sureface-500">
      <header class="card-header"><h4>Personal Access Token</h4></header>
      <section class="p-4 grid grid-cols-2 gap-y-2 items-center">
        <label for="account">Account:</label>
        <span id="account" class="w-full">{account}</span>
        <label for="token">Token:</label>
        <div id="token">{revealed ? token : placeHolderToken}</div>
        <label for="expires">Expires:</label>
        <div>
          <span id="expires" class="w-1/3 mr-2"
            >{getTokenExpirationAsDate($user?.token || '')
              ?.toString()
              ?.substring(0, 24)}</span
          >
          {#if badge}
            <span id="expires-badge" class="badge {badge}" data-testid="expires-badge"
              >{badge.toUpperCase()}</span
            >
          {/if}
        </div>
      </section>
      <footer class="card-footer mt-2">
        <CopyButton
          itemToCopy={$user.token || ''}
          class="preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
        />
        <Modal
          data-testid="refresh"
          title="Please Confirm"
          onconfirm={refreshToken}
          disabled={refreshButtonDisabled}
          triggerBase="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
          footerButtons
          withDefault
        >
          {#snippet trigger()}
            {#await refreshPromise}
              <Loading ring size="micro" label="Refreshing" />
            {:then text}
              {text}
            {/await}
          {/snippet}
          Are you sure you wish to invalidate your old token and create a new one?
        </Modal>
        <button
          data-testid="reveal-btn"
          class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
          onclick={revealToken}>{revealed ? 'Hide' : 'Reveal'}</button
        >
      </footer>
    </div>
  {:catch}
    <ErrorAlert>
      An error occured while to retrieving your account. If this problem persists, please contact an
      administrator.
    </ErrorAlert>
  {/await}
</div>

<style>
  #user-token-container {
    display: flex;
    justify-content: center;
    width: 52rem;
  }
  #user-token-container #user-token {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  #user-token-container #user-token section {
    min-width: 50rem;
    grid-template-columns: min-content auto;
  }
  #user-token-container #user-token section label {
    text-align: right;
    clear: both;
    float: left;
    margin-right: 15px;
  }
</style>
