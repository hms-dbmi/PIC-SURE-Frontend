<script lang="ts">
  import Content from '$lib/components/Content.svelte';
  import { branding } from '$lib/configuration';
  import Explorer from '$lib/components/explorer/Explorer.svelte';
  import {filters, hasGenomicFilter, hasStigmatizedFilter} from "$lib/stores/Filter.ts";
  import {goto} from "$app/navigation";

  if (hasGenomicFilter) {
    alert("You have genomic filters");
    goto("/explore")
  }
  if (hasStigmatizedFilter) {
    alert("You have Stigmatized filters");
    goto("/explore")
  }
  filters.set($filters);
</script>

<svelte:head>
  <title>{branding.applicationName} | Discover</title>
</svelte:head>

<Content full>
  <Explorer />
</Content>
