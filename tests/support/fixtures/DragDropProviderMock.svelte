<script lang="ts">
  interface Props {
    children: import('svelte').Snippet;
    onDragStart?: (event: unknown) => void;
    onDragOver?: (event: unknown) => void;
    onDragEnd?: (event: unknown) => void;
  }

  let { children, onDragStart, onDragOver, onDragEnd }: Props = $props();
  const event = () =>
    (globalThis as typeof globalThis & { __bannerDndEvent?: unknown }).__bannerDndEvent;
</script>

<button data-testid="dnd-start" onclick={() => onDragStart?.(event())}>start</button>
<button data-testid="dnd-over" onclick={() => onDragOver?.(event())}>over</button>
<button data-testid="dnd-end" onclick={() => onDragEnd?.(event())}>end</button>
{@render children()}
