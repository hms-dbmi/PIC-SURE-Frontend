<script lang="ts" module>
  export interface TimedMessage {
    afterMs: number;
    text: string;
  }
</script>

<script lang="ts">
  import Loading from '#lib/ui/Loading.svelte';

  interface Props {
    // afterMs counts from mount or the last messages change, so pass a stable constant array.
    messages: TimedMessage[];
    size?: 'micro' | 'mini' | 'small' | 'medium' | 'large';
    color?: string;
  }

  const { messages, size = 'small', color = 'primary' }: Props = $props();

  let elapsedMs = $state(0);
  const text = $derived(messages.filter(({ afterMs }) => afterMs <= elapsedMs).at(-1)?.text ?? '');

  $effect.pre(() => {
    elapsedMs = 0;
    const timers = messages
      .filter(({ afterMs }) => afterMs > 0)
      .map(({ afterMs }) => setTimeout(() => (elapsedMs = afterMs), afterMs));
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
