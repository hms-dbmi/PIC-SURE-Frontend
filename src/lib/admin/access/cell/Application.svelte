<script lang="ts">
  import * as admin from '#lib/admin/entities.ts';

  let { data }: { data: { cell: '' } } = $props();
</script>

{data.cell ? admin.applications.find(data.cell)?.name : 'none'}
