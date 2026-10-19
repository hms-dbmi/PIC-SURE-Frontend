<script lang="ts">
  import AccessKindPage from '#lib/admin/access/AccessKindPage.svelte';
  import type { PageProps } from './$types';

  let { params }: PageProps = $props();
</script>

<AccessKindPage kind={params.kind} uuid={params.uuid} />
