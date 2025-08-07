<script lang="ts">
  import { UploadStatus } from '$lib/models/DataRequest';

  export type StatusIndicatorProps = {
    status: UploadStatus | undefined;
    label: string;
  };

  let { status = UploadStatus.Unsent, label }: StatusIndicatorProps = $props();

  function getStatusIcon() {
    switch (status) {
      case UploadStatus.Uploaded:
        return 'fa-solid fa-circle-check text-success-600-400';
      case UploadStatus.Error:
        return 'fa-solid fa-xmark text-error-600-400';
      case UploadStatus.Unknown:
        return 'fa-solid fa-circle-question text-warning-600-400';
      case UploadStatus.Uploading:
      case UploadStatus.Queued:
      case UploadStatus.Querying:
        return 'fa-regular fa-paper-plane text-tertiary-600-400';
      case UploadStatus.Unsent:
      default:
        return 'fa-regular fa-paper-plane text-gray-500';
    }
  }
</script>

<div
  class="flex flex-row items-center gap-2"
  data-testid={`status-indicator-${label?.replaceAll(' ', '-')?.toLowerCase()}`}
>
  <i class={`${getStatusIcon()} flex-none`} title={status} data-testid={`status-indicator-icon`}
  ></i>
  <span>{label}</span>
</div>

<style>
  .text-gray-500 {
    color: var(--color-gray-500);
  }
</style>
