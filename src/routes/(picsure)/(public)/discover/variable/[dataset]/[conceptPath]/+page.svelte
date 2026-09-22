<script lang="ts">
  import { config } from '$lib/configuration.svelte';

  import Content from '$lib/components/Content.svelte';
  import VariableDetail from '$lib/components/explorer/VariableDetail.svelte';

  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{config.branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <VariableDetail section="discover" variableKey={data.variableKey} />
</Content>
