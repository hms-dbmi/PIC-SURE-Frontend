<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import { isTopAdmin } from '$lib/stores/User';
  import { toaster } from '$lib/toaster';
  import { revokeApiKey } from '$lib/stores/ApiKeys';
  import { extractApiError } from '$lib/models/ApiKey';

  const { data = { cell: '', row: { prefix: '', status: '' } } } = $props();

  async function revoke() {
    // defense-in-depth beyond the disabled trigger; matches the sibling admin action cells
    if (!$isTopAdmin) return;
    try {
      await revokeApiKey(data.cell);
      toaster.success({
        title: `Successfully revoked API key '${data.row.prefix}'`,
      });
    } catch (error) {
      toaster.error({
        title: `Failed to revoke API key '${data.row.prefix}'`,
        description: extractApiError(error),
      });
    }
  }
</script>

{#if data.row.status === 'Active'}
  <Modal
    data-testid="api-key-{data.cell}-revoke"
    title="Revoke API Key?"
    confirmText="Revoke"
    cancelText="Cancel"
    confirmClass="preset-filled-error-500"
    disabled={!$isTopAdmin}
    onconfirm={revoke}
    triggerBase="btn preset-tonal-error border border-error-500 hover:preset-filled-error-500"
    withDefault
  >
    {#snippet trigger()}Revoke{/snippet}
    <p>
      Are you sure you want to revoke API key '{data.row.prefix}'? Revocation is permanent and
      cannot be undone.
    </p>
  </Modal>
{/if}
