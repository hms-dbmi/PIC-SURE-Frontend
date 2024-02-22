<script lang="ts">
  import Content from '$lib/component/content.svelte';
  import { page } from '$app/stores';
  export const title = $page.url.searchParams.get('title') || 'Dummy';
</script>

<Content {title}>
  <p>Some help page content.</p>
</Content>
