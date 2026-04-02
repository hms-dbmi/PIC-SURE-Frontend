<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  let { data = { cell: '', row: {} } } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="flex items-center" onclick={(e) => e.stopPropagation()}>
  <span class="monospace">{data.cell}</span>
  <CopyButton data-testid="{data.cell}-copy" useIcon itemToCopy={data.cell} />
</div>
