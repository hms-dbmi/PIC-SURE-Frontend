<script lang="ts">
  import { sendData } from '$lib/stores/DataRequest';

  import { browser } from '$app/environment';

  import Modal from '$lib/components/Modal.svelte';

  let disablePrompt = $state(false);
  let modalOpen: boolean = $state(false);
  const { sendEnabled = false }: { sendEnabled?: boolean } = $props();

  async function close() {
    if (disablePrompt && browser) {
      localStorage.setItem('dataRequest-sendData-displayPrompt', 'no');
    }

    modalOpen = false;

    await sendData();
  }
</script>

<button
  type="button"
  data-testid="send-data-btn"
  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
  disabled={!sendEnabled}
  onclick={disablePrompt ? sendData : () => (modalOpen = true)}>Send Data</button
>
<Modal
  data-testid="send-data"
  open={modalOpen}
  disabled={!sendEnabled}
  withDefault={false}
  onconfirm={sendData}
>
  <p class="font-bold text-center mb-4">
    Sending data from PIC-SURE to Service Workbench could take several minutes.
  </p>
  <p class="font-bold text-center mb-4">
    To update the status of your data upload, click the refresh button
    <i class="fa-solid fa-arrows-rotate fa-sm text-primary-500"></i>
    next to "Status".
  </p>
  <div class="flex gap-2">
    <div class="flex-auto">
      <label>
        <input
          data-testid="send-data-remember-checkbox"
          type="checkbox"
          class="checkbox flex-none"
          bind:checked={disablePrompt}
        /> I understand, don't show this again
      </label>
    </div>
    <div class="flex-none test-right">
      <button
        type="button"
        data-testid="send-data-modal-confirm-btn"
        class="btn preset-filled-primary-500"
        onclick={close}
      >
        Okay, got it!
      </button>
    </div>
  </div>
</Modal>
