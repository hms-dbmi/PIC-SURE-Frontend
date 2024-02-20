<script lang="ts">
  import {
    type ToastSettings,
    type ModalSettings,
    getModalStore,
    getToastStore,
    ProgressRadial,
  } from '@skeletonlabs/skeleton';
  import * as api from '$lib/api';
  import type { User } from '../models/User';
  import CopyButton from './CopyButton.svelte';
  import ErrorAlert from './ErrorAlert.svelte';

  type LongTermTokenResponse = {
    userLongTermToken: string;
  };
  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let rows = 1;
  let account = '';
  let placeHolderToken =
    '•••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
  let textarea: HTMLTextAreaElement;
  let revealed = false;
  let refreshButtonDisabled = false;
  let refreshButtonText = 'Refresh';
  let user: User;

  $: displayedToken = revealed ? user?.token : placeHolderToken;
  $: revealButtonText = revealed ? 'Hide' : 'Reveal';
  $: expires = user && user.token ? extractExperationDate(user.token) : 0;
  $: badge = expires && checkIfExpired();
  $: account = user?.email || 'There was an error retrieving your account.';

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
    const modal: ModalSettings = {
      type: 'confirm',
      title: 'Please Confirm',
      body: 'Are you sure you wish to invalidate your old token and create a new one?',
      response: (r: boolean) => r && refreshToken(),
    };
    modalStore.trigger(modal);
  }

  function extractExperationDate(token: string) {
    if (!token) return 0;
    try {
      return JSON.parse(atob(token.split('.')[1])).exp * 1000;
    } catch (error) {
      console.error(error);
      const extractExperationDateErrorToast: ToastSettings = {
        message:
          'An error occured while parsing your token. Please try again later. If this problem persists, please contact an administrator.',
        background: 'variant-filled-error',
      };
      toastStore.trigger(extractExperationDateErrorToast);
      return 0; //TODO: Handle errors
    }
  }

  async function getUser(): Promise<User> {
    return await api
      .get('/psama/user/me?hasToken')
      .then((response: User) => {
        user = response;
        return response;
      })
      .catch((error) => {
        console.error('Error getting user:\n', error);
        throw error;
      });
  }

  async function refreshToken() {
    const newLongTermToken = await api
      .get('/psama/user/me/refresh_long_term_token')
      .then((response: LongTermTokenResponse) => {
        return response.userLongTermToken;
      })
      .catch((error) => {
        console.error(error);
        return;
      });
    if (!newLongTermToken) {
      refreshButtonText = 'Error';
      const refreshErrorToast: ToastSettings = {
        message:
          'An error occured while refreshing your token. Please try again later. If this problem persists, please contact an administrator.',
        background: 'variant-filled-error',
      };
      toastStore.trigger(refreshErrorToast);
      return;
    }
    user.token = newLongTermToken;
    refreshButtonText = 'Refreshed!';
    refreshButtonDisabled = true;
    rows = updateRows();
  }

  function revealToken() {
    revealed = !revealed;
    rows = updateRows();
  }

  function updateRows() {
    if (!revealed || !user.token) return 1;
    let fontSizeInPt = +window.getComputedStyle(textarea).fontSize.split('px')[0] * 0.75;
    return Math.ceil((user.token.length * (fontSizeInPt - 1)) / textarea.clientWidth);
  }
</script>

<div id="user-token-container">
  {#await getUser()}
    <ProgressRadial width="w-10" value={undefined} />
  {:then}
    <div id="user-token" class="card variant-filled-sureface">
      <header class="card-header">PIC-SURE Token</header>
      <section class="p-4 grid grid-cols-2 gap-y-2 items-center">
        <label for="account">Account:</label>
        <span id="account" class="w-full">{account}</span>
        <label for="token">Token:</label>
        <textarea id="token" bind:value={displayedToken} bind:this={textarea} {rows} disabled
        ></textarea>
        <label for="expires">Expires:</label>
        <div>
          <span id="expires" class="w-1/3 mr-2"
            >{new Date(expires).toString().substring(0, 24)}</span
          >
          {#if badge}
            <span id="expires-badge" class="badge {badge}" data-testid="expires-badge"
              >{badge.toUpperCase()}</span
            >
          {/if}
        </div>
      </section>
      <footer class="card-footer">
        <CopyButton
          buttonText="Copy"
          itemToCopy={user.token || ''}
          classes={['variant-ringed-primary']}
        />
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
  #user-token-container #user-token section textarea {
    max-width: 48rem;
    word-wrap: break-word;
    height: fit-content;
  }
  #user-token-container #user-token section label {
    text-align: right;
    clear: both;
    float: left;
    margin-right: 15px;
  }
</style>
