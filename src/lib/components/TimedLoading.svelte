<script lang="ts" module>
  export interface TimedMessage {
    afterMs: number;
    text: string;
  }
</script>

<script lang="ts">
  import Loading from '$lib/components/Loading.svelte';

  const {
    messages,
    size = 'small',
    color = 'primary',
  }: {
    // Each message shows once afterMs has passed since mount, or since messages last changed.
    messages: TimedMessage[];
    size?: 'micro' | 'mini' | 'small' | 'medium' | 'large';
    color?: string;
  } = $props();

  let text = $state('');

  $effect(() => {
    text = messages.filter(({ afterMs }) => afterMs <= 0).at(-1)?.text ?? '';
    const timers = messages
      .filter(({ afterMs }) => afterMs > 0)
      .map(({ afterMs, text: next }) => setTimeout(() => (text = next), afterMs));
    return () => timers.forEach(clearTimeout);
  });
</script>

{#if size === 'micro'}
  <div class="flex items-center">
    <Loading ring {size} {color} />
    <span role="status">{text}</span>
  </div>
{:else}
  <div class="flex flex-col items-center gap-4">
    <Loading ring {size} {color} />
    <p role="status" class="text-center">{text}</p>
  </div>
{/if}
