<script lang="ts">
  import { getApplication } from '#lib/admin/access/Application.ts';

  let { data }: { data: { cell: '' } } = $props();
</script>

{data.cell ? getApplication(data.cell)?.name : 'none'}
