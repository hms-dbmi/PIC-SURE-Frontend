<script lang="ts">
  import ConfirmDialog from '#lib/ui/dialog/ConfirmDialog.svelte';
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
  <ConfirmDialog
    data-testid="admin-api-key-revoke-{data.cell}"
    title="Revoke API Key?"
    confirmLabel="Revoke"
    tone="danger"
    disabled={!$isTopAdmin}
    onconfirm={revoke}
    triggerClass="btn preset-tonal-error border border-error-500 hover:preset-filled-error-500"
  >
    {#snippet trigger()}Revoke{/snippet}
    <p>
      Are you sure you want to revoke API key '{data.row.prefix}'? Revocation is permanent and
      cannot be undone.
    </p>
  </ConfirmDialog>
{/if}
