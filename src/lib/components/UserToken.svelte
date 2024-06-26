<script lang="ts">
  import { getModalStore, getToastStore, ProgressRadial } from '@skeletonlabs/skeleton';
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import {
    user,
    getUser,
    getTokenExpiration,
    getTokenExpirationAsDate,
    refreshLongTermToken as refresh,
  } from '$lib/stores/User';

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let account = '';
  let placeHolderToken =
    '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  let revealed = false;
  let refreshButtonDisabled = false;
  let refreshButtonText = 'Refresh';

  $: displayedToken = revealed ? $user?.token : placeHolderToken;
  $: revealButtonText = revealed ? 'Hide' : 'Reveal';
  $: expires = $user && $user.token ? extractExperationDate($user.token) : 0;
  $: badge = expires && checkIfExpired();
  $: account = $user?.email || 'There was an error retrieving your account.';

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

  function confirmRefreshToken() {
    modalStore.trigger({
      type: 'confirm',
      title: 'Please Confirm',
      body: 'Are you sure you wish to invalidate your old token and create a new one?',
      response: (r: boolean) => r && refreshToken(),
    });
  }

  function extractExperationDate(token: string) {
    if (!token) return 0;
    try {
      return getTokenExpiration(token);
    } catch (error) {
      console.error(error);
      toastStore.trigger({
        message:
          'An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.',
        background: 'variant-filled-error',
      });
      return 0; //TODO: Handle errors
    }
  }

  async function refreshToken() {
    await refresh().catch((e) => {
      console.log(e);
      toastStore.trigger({
        message:
          'An error occured while refreshing your token. Please try again later. If this problem persists, please contact an administrator.',
        background: 'variant-filled-error',
      });
      refreshButtonText = 'Error';
    });
    refreshButtonText = 'Refreshed!';
    refreshButtonDisabled = true;
  }

  function revealToken() {
    revealed = !revealed;
  }
</script>

<div id="user-token-container">
  {#await getUser(true)}
    <ProgressRadial width="w-10" value={undefined} />
  {:then}
    <div id="user-token" class="card variant-filled-sureface">
      <header class="card-header">PIC-SURE Token</header>
      <section class="p-4 grid grid-cols-2 gap-y-2 items-center">
        <label for="account">Account:</label>
        <span id="account" class="w-full">{account}</span>
        <label for="token">Token:</label>
        <div id="token">{displayedToken}</div>
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
      <footer class="card-footer">
        <CopyButton buttonText="Copy" itemToCopy={$user.token || ''} />
        <button
          id="refresh-button"
          class="btn variant-ringed-primary"
          on:click={confirmRefreshToken}
          disabled={refreshButtonDisabled}>{refreshButtonText}</button
        >
        <button id="reveal-button" class="btn variant-ringed-primary" on:click={revealToken}
          >{revealButtonText}</button
        >
      </footer>
    </div>
  {:catch}
    <ErrorAlert
      title="An error occured while to retrieving your account. If this problem persists, please
    contact an administrator."
    />
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
