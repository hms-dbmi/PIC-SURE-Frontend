<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import { open as drawerState } from '$lib/stores/Drawer';

  let {
    position = 'right',
    width = 'w-[480px]',
    trigger,
    children,
  }: {
    position: 'right' | 'left';
    width: string;
    trigger?: Snippet;
    children?: Snippet;
  } = $props();

  const justify = position === 'left' ? 'justify-start' : 'justify-end';

  // Tips for Drawer modals:
  // - Use `contentBase` to set styles, including height/width
  // - Set justify-start to align to the left
  // - Clear the align and padding styles
  // - Use `positionerClasses` to set the
  // - Set transition.x values that matches content width in pixels
</script>

<Modal
  open={$drawerState}
  onOpenChange={(e) => ($drawerState = e.open)}
  triggerBase="btn preset-tonal"
  contentBase="bg-surface-50-950 p-4 space-y-4 shadow-xl {width} h-screen overflow-auto"
  positionerJustify={justify}
  positionerAlign=""
  positionerPadding=""
  transitionsPositionerIn={{ x: -480, duration: 200 }}
  transitionsPositionerOut={{ x: -480, duration: 200 }}
  ids={{ content: 'drawer' }}
  {trigger}
>
  {#snippet content()}
    {@render children?.()}
  {/snippet}
</Modal>
