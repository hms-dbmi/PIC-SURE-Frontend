<script lang="ts">
  import { branding } from '$lib/configuration';
  import Content from '$lib/components/Content.svelte';
  import ErrorAlert from '$lib/components/ErrorAlert.svelte';
  import ApiKeyTable from '$lib/components/admin/api-key/ApiKeyTable.svelte';
  import MintPlatformKeyModal from '$lib/components/admin/api-key/MintPlatformKeyModal.svelte';
  import { isTopAdmin } from '$lib/stores/User';
</script>

<svelte:head>
  <title>{branding.applicationName} | API Keys</title>
</svelte:head>
<Content title="API Keys">
  {#if !$isTopAdmin}
    <ErrorAlert title="Top Administrator Only" color="warning">
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
    <ApiKeyTable keyType="PLATFORM" tableName="PlatformApiKeys" />
  </section>

  <section>
    <h2 class="h3 mb-3">User Keys</h2>
    <ApiKeyTable keyType="USER" tableName="UserApiKeys" />
  </section>
</Content>
