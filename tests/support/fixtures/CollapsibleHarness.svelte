<script lang="ts">
  import CollapsibleGroup from '#lib/ui/CollapsibleGroup.svelte';
  import CollapsiblePanel from '#lib/ui/CollapsiblePanel.svelte';

  let { multiple = false }: { multiple?: boolean } = $props();
  let open = $state(['first']);
</script>

<CollapsibleGroup value={open} onchange={(value) => (open = value)} {multiple} collapsible>
  <CollapsiblePanel value="first">
    {#snippet heading()}First{/snippet}
    <p>First body</p>
  </CollapsiblePanel>
  <CollapsiblePanel value="second">
    {#snippet heading()}Second{/snippet}
    <p>Second body</p>
  </CollapsiblePanel>
</CollapsibleGroup>
