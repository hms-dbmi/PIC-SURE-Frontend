<script lang="ts">
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';
  import ApiKeyTable from '#lib/admin/apiKeys/ApiKeyTable.svelte';
  import MintPlatformKeyModal from '#lib/admin/apiKeys/MintPlatformKeyModal.svelte';
  import { session } from '#lib/auth/session.svelte.ts';
</script>

{#if !session.isTopAdmin}
  <ErrorAlert data-testid="admin-top-admin-required" title="Top Administrator Only" color="warning">
    <p>
      API keys are READ ONLY for admin users. Please contact your administrator to make changes.
    </p>
  </ErrorAlert>
{/if}
<section class="mb-10">
  <div class="flex items-center justify-between mb-3">
    <h2 class="h3">Platform Keys</h2>
    <MintPlatformKeyModal />
  </div>
  <ApiKeyTable
    keyType="PLATFORM"
    tableName="PlatformApiKeys"
    data-testid="admin-api-key-platform-table"
    id="admin-api-key-platform-table"
  />
</section>

<section>
  <h2 class="h3 mb-3">User Keys</h2>
  <ApiKeyTable
    keyType="USER"
    tableName="UserApiKeys"
    data-testid="admin-api-key-user-table"
    id="admin-api-key-user-table"
  />
</section>
