<script lang="ts">
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import { session } from '#lib/auth/session.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { apiKeys } from '#lib/admin/apiKeys/apiKeys.svelte.ts';
  import { extractApiError } from '#lib/admin/apiKeys/model.ts';

  interface Props {
    /** The table's cell contract: `cell` is the key's uuid. */
    data: { cell: string; row: { prefix: string; status: string } };
  }

  const { data }: Props = $props();

  async function revoke() {
    // defense-in-depth beyond the disabled trigger
    if (!session.isTopAdmin) return;
    try {
      await apiKeys.revoke(data.cell);
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
  <ConfirmButton
    label="Revoke"
    variant="tonal-error"
    data-testid="admin-api-key-revoke-{data.cell}"
    title="Revoke API Key?"
    confirmLabel="Revoke"
    tone="danger"
    disabled={!session.isTopAdmin}
    onconfirm={revoke}
  >
    <p>
      Are you sure you want to revoke API key '{data.row.prefix}'? Revocation is permanent and
      cannot be undone.
    </p>
  </ConfirmButton>
{/if}
