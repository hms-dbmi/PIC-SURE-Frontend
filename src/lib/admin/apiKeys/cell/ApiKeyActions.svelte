<script lang="ts">
  import Modal from '#lib/ui/dialog/Modal.svelte';
  import { isTopAdmin } from '#lib/auth/User.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { revokeApiKey } from '#lib/admin/apiKeys/ApiKeys.ts';
  import { extractApiError } from '#lib/admin/apiKeys/model.ts';

  const { data = { cell: '', row: { prefix: '', status: '' } } } = $props();

  async function revoke() {
    // defense-in-depth beyond the disabled trigger
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
    data-testid="admin-api-key-revoke-{data.cell}"
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
