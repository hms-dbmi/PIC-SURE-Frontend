<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';

  interface Props {
    open?: boolean;
    position?: 'right' | 'left';
    size?: 'narrow' | 'half';
    'aria-label': string;
    /** Runs whenever the drawer dismisses itself: Escape or a backdrop click. */
    onclose?: () => void;
    children: Snippet;
  }

  let {
    open = $bindable(false),
    position = 'right',
    size = 'narrow',
    'aria-label': ariaLabel,
    onclose,
    children,
  }: Props = $props();

  const widths = { narrow: 'w-[480px]', half: 'w-1/2' };
  const justify = $derived(position === 'left' ? 'justify-start' : 'justify-end');
</script>

<Modal
  {open}
  onOpenChange={(e) => {
    // onclose runs before open changes, like the other dialogs' handlers
    if (open && !e.open) onclose?.();
    open = e.open;
  }}
  aria-label={ariaLabel}
  contentBase="bg-surface-50-950 p-4 space-y-4 shadow-xl {widths[size]} h-screen overflow-auto"
  positionerJustify={justify}
  positionerAlign=""
  positionerPadding=""
  transitionsPositionerIn={{ x: -480, duration: 200 }}
  transitionsPositionerOut={{ x: -480, duration: 200 }}
>
  {#snippet content()}
    {@render children()}
  {/snippet}
</Modal>
