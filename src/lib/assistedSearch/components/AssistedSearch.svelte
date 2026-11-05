<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';

  import type { ChatSession } from '../chat.svelte';
  import ChatWindow from './ChatWindow.svelte';

  let { session }: { session: ChatSession } = $props();
</script>

<!-- One conversation, two views: the full-screen view is the same session, not a second thread. -->
{#if session.fullScreen}
  <Modal bind:open={session.fullScreen} width="w-[90vw]" height="h-[90vh]" data-testid="chat-modal">
    <ChatWindow {session} fullScreen />
  </Modal>
  <button
    type="button"
    class="btn preset-tonal-primary border border-primary-500"
    onclick={() => (session.fullScreen = false)}
    >The assistant is open in full screen. Bring it back</button
  >
{:else}
  <ChatWindow {session} />
{/if}
