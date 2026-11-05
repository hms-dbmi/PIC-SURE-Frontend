<script lang="ts">
  import { slide } from 'svelte/transition';

  import type { ChatSession } from '../chat.svelte.ts';
  import ChatWindow from './ChatWindow.svelte';

  let { session }: { session: ChatSession } = $props();

  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<!--
  The panel sits above the page, so search, facets and results stay on screen and editable.
  The toggle lives in the layout's `{#if}`, not here, so the transition has to be global.
-->
<div
  id="assisted-search"
  class="flex-none px-6 pt-4 pb-2"
  data-testid="assisted-search"
  transition:slide|global={{ duration: reducedMotion ? 0 : 200 }}
>
  <ChatWindow {session} />
</div>
