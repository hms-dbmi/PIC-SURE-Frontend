<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import EntityActions from '#lib/admin/access/cell/EntityActions.svelte';

  let { data }: Pick<ComponentProps<typeof EntityActions>, 'data'> = $props();
</script>

<EntityActions kind="role" {data} />
