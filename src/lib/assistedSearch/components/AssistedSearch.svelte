<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  import type { ChatSession } from '../chat.svelte';
  import ChatWindow from './ChatWindow.svelte';

  let { session }: { session: ChatSession } = $props();
</script>

<!--
  One conversation, two views: the full-screen view is the same session, not a second thread.
  Full screen replaces the band above the page; closing it brings the band back.
-->
{#if session.fullScreen}
  <Modal bind:open={session.fullScreen} width="w-[90vw]" height="h-[90vh]" data-testid="chat-modal">
    <ChatWindow {session} fullScreen />
  </Modal>
{:else}
  <div
    id="assisted-search"
    class="flex-none px-6 py-4 border-b border-surface-300-700"
    data-testid="assisted-search"
  >
    <ChatWindow {session} />
  </div>
{/if}
