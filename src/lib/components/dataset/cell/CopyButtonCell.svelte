<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  export let data = { cell: '', row: {} };
</script>

<div class="flex items-center">
  <span class="monospace">{data.cell}</span>
  <CopyButton data-testid="{data.cell}-copy-btn" useIcon={true} itemToCopy={data.cell} />
</div>
