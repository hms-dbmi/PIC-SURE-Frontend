<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  const modalStore = getModalStore();

  import { browser } from '$app/environment';

  let disablePrompt = false;

  async function close() {
    if (disablePrompt && browser) {
      localStorage.setItem('dataRequest-sendData-displayPrompt', 'no');
    }
    if ($modalStore[0]) {
      const sendData = $modalStore[0]?.meta.sendData
        ? $modalStore[0].meta.sendData
        : () => {
            console.log('dummy method');
          };
      await sendData();
      modalStore.close();
    }
  }
</script>

<p class="font-bold text-center">
  Sending data from PIC-SURE to Service Workbench could take several minutes.
</p>
<p class="font-bold text-center">
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
      class="btn variant-ringed-primary hover:variant-ghost-primary"
      on:click={close}
    >
      Okay, got it!
    </button>
  </div>
</div>
