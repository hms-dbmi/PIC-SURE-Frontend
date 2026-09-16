<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import VariableDetail from '$lib/components/explorer/VariableDetail.svelte';

  import type { PageData } from './$types';

  // A thin wrapper, the same shape as the two results pages around <Explorer>. The document
  // title lives in VariableDetail, which is what knows the variable's name.
  let { data }: { data: PageData } = $props();
</script>

<Content full>
  <VariableDetail section="explorer" variableKey={data.variableKey} />
</Content>
