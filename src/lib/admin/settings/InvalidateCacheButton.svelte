<script lang="ts">
  import { adminConfig } from '#lib/admin/settings/adminConfig.svelte.ts';
  import ConfirmButton from '#lib/ui/ConfirmButton.svelte';
  import { toaster } from '#lib/ui/toaster.ts';

  interface Props {
    testIdBase: string;
  }

  let { testIdBase }: Props = $props();

  async function invalidateCache() {
    try {
      await adminConfig.invalidateServerCache();
      toaster.success({ title: 'Server-side config cache invalidated' });
      // Give the toast a moment to render before the reload tears down the page.
      setTimeout(() => window.location.reload(), 750);
    } catch (e) {
      console.error(e);
      toaster.error({ title: 'Failed to invalidate config cache' });
    }
  }
</script>

<ConfirmButton
  label="Invalidate Cache & Refresh"
  variant="tonal-surface"
  dialogSize="third"
  data-testid={`admin-config-invalidate-cache-${testIdBase}`}
  title="Invalidate Cache?"
  confirmLabel="Yes"
  cancelLabel="No"
  onconfirm={invalidateCache}
>
  Are you sure you want to invalidate the server-side config cache? This immediately forces the app
  to refetch all cached values from the backend, instead of waiting for the routine refresh (up to 4
  hours). Individual users will still need to refresh their browsers in order to see the changed
  values.
</ConfirmButton>
