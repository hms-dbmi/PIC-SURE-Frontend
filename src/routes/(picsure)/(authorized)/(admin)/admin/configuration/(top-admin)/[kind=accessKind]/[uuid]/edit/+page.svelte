<script lang="ts">
  import Content from '#lib/shell/Content.svelte';
  import AccessKindPage, { accessKindTitle } from '#lib/admin/access/AccessKindPage.svelte';
  import type { PageProps } from './$types';

  let { params }: PageProps = $props();
</script>

<Content
  title={accessKindTitle(params.kind, params.uuid)}
  backUrl="/admin/configuration"
  backTitle="Back to Configuration"
>
  <AccessKindPage kind={params.kind} uuid={params.uuid} />
</Content>
