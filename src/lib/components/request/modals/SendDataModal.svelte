<script lang="ts">
  import { sendData } from '$lib/services/datarequest';
  import { Query, type QueryInterface } from '$lib/models/query/Query';
  import { UploadStatus, type DataType, type Status } from '$lib/models/DataRequest';

  import { browser } from '$app/environment';

  import Modal from '$lib/components/Modal.svelte';

  export type SendDataModalProps = {
    sendEnabled: boolean;
    query: QueryInterface | undefined;
    selectedSite: string | undefined;
    dataType: DataType;
    datasetId: string | undefined;
    status: Status | undefined;
  };

  let disablePrompt = $state(false);
  let modalOpen: boolean = $state(false);
  let { sendEnabled = $bindable(false), query = new Query(), selectedSite, dataType, datasetId, status = $bindable() }: SendDataModalProps = $props();

  async function close() {
    if (disablePrompt && browser) {
      localStorage.setItem('dataRequest-sendData-displayPrompt', 'no');
    }

    modalOpen = false;

    const dataTypesToSend: string[] = Object.entries(dataType)
      .filter(([key, value]) => value)
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
    for (const dataType of dataTypesToSend) {
      status = await sendData(query, selectedSite || '', dataType, datasetId || '');
    }
  }
</script>

<button
  type="button"
  data-testid="send-data-btn"
  class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
  disabled={!sendEnabled}
  onclick={disablePrompt ? () => close() : () => (modalOpen = true)}>Send Data</button
>
<Modal
  data-testid="send-data"
  open={modalOpen}
  disabled={!sendEnabled}
  withDefault={false}
    onconfirm={() => close()}
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
