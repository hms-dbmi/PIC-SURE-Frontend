<script lang="ts">
  import { getConfigMode } from '#lib/config/resolve.ts';
  import type { AdminConfigKind } from '#lib/admin/settings/adminConfig.svelte.ts';
  import ErrorAlert from '#lib/ui/ErrorAlert.svelte';

  interface Props {
    kinds: AdminConfigKind[];
    /** The kinds whose admin API this environment doesn't offer. */
    unavailable: AdminConfigKind[];
    testIdBase: string;
  }

  let { kinds, unavailable, testIdBase }: Props = $props();

  const overridden = getConfigMode() === 'override';

  function commaList(list: string[]) {
    switch (list.length) {
      case 0:
        return '';
      case 1:
        return list[0];
      case 2:
        return list.join(' and ');
      default:
        return list.slice(0, -1).join(', ') + ' and ' + list.slice(-1);
    }
  }
</script>

{#if unavailable.length > 0 || overridden}
  <ErrorAlert
    color="secondary"
    iconSize="lg"
    data-testid={`admin-config-api-unavailable-${testIdBase}`}
  >
    <span class="font-bold">Some values are disabled</span> and can't be edited here:
    <ul class="ml-4 list-disc">
      {#if overridden}
        <li>Environment variables are set to override api values.</li>
      {/if}
      {#if unavailable.length > 0}
        <li>
          API overrides are not available for {commaList(unavailable)} in this environment.
        </li>
      {/if}
    </ul>
  </ErrorAlert>
{/if}
{#if kinds.includes('branding')}
  <ErrorAlert color="secondary" iconSize="lg" data-testid="admin-config-branding-scope-note">
    <span class="font-bold">Limited scope:</span> Most branding is sourced from the build-time configuration
    file.
  </ErrorAlert>
{/if}
