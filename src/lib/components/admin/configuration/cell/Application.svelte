<script lang="ts">
  import { getApplication } from '$lib/stores/Application';

  let { data }: { data: { cell: '' } } = $props();
</script>

{data.cell ? getApplication(data.cell)?.name : 'none'}
