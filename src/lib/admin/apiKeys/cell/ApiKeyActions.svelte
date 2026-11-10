<script lang="ts">
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import { session } from '#lib/auth/session.svelte.ts';
  import { toaster } from '#lib/ui/toaster.ts';
  import { apiKeys } from '#lib/admin/apiKeys/apiKeys.svelte.ts';
  import { extractApiError } from '#lib/admin/apiKeys/model.ts';

  interface Props {
    uuid: string;
    prefix: string;
    status: string;
  }

  const { uuid, prefix, status }: Props = $props();

  async function revoke() {
    // defense-in-depth beyond the disabled trigger
    if (!session.isTopAdmin) return;
    try {
      await apiKeys.revoke(uuid);
      toaster.success({
        title: `Successfully revoked API key '${prefix}'`,
      });
    } catch (error) {
      toaster.error({
        title: `Failed to revoke API key '${prefix}'`,
        description: extractApiError(error),
      });
    }
  }
</script>

{#if status === 'Active'}
  <ConfirmButton
    label="Revoke"
    variant="tonal-error"
    data-testid="admin-api-key-revoke-{uuid}"
    title="Revoke API Key?"
    confirmLabel="Revoke"
    tone="danger"
    disabled={!session.isTopAdmin}
    onconfirm={revoke}
  >
    <p>
      Are you sure you want to revoke API key '{prefix}'? Revocation is permanent and cannot be
      undone.
    </p>
  </ConfirmButton>
{/if}
