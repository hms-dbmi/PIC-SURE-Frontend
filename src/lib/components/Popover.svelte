<script lang="ts">
  import type { Snippet } from 'svelte';
  import {
    FloatingArrow,
    arrow,
    autoUpdate,
    flip,
    offset,
    useClick,
    useDismiss,
    useFloating,
    useInteractions,
    useRole,
  } from '@skeletonlabs/floating-ui-svelte';
  import { fade } from 'svelte/transition';
  import { shift, type Placement } from '@floating-ui/dom';

  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    triggerStyle?: string;
    placement?: Placement;
    color?: string;
    'data-testid'?: string;
    trigger?: Snippet;
    children?: Snippet;
    onengage?: () => void;
  }

  let {
    open = $bindable(false),
    title,
    message,
    triggerStyle = '',
    placement = 'top',
    color = 'surface',
    'data-testid': testid = '',
    trigger,
    children,
    onengage = () => {},
  }: Props = $props();

  let elemArrow: HTMLElement | null = $state(null);

  // Use Floating
  const floating = useFloating({
    whileElementsMounted: autoUpdate,
    get open() {
      return open;
    },
    onOpenChange: (newOpen: boolean) => {
      if (newOpen) onengage();
      open = newOpen;
    },
    placement: placement,
    get middleware() {
      return [offset(10), flip(), shift(), elemArrow && arrow({ element: elemArrow })];
    },
  });

  // Interactions
  const role = useRole(floating.context);
  const click = useClick(floating.context);
  const dismiss = useDismiss(floating.context);
  const interactions = useInteractions([role, click, dismiss]);
</script>

<button
  bind:this={floating.elements.reference}
  data-testid="{testid}-btn"
  class="cursor-pointer {triggerStyle}"
  {...interactions.getReferenceProps()}
>
  {@render trigger?.()}
</button>
{#if open}
  <div
    bind:this={floating.elements.floating}
    class="popover"
    style="background-color: var(--color-{color}-200);{floating.floatingStyles}"
    {...interactions.getFloatingProps()}
    data-testid={testid}
    transition:fade={{ duration: 200 }}
  >
    <div>
      {#if title}
        <header class="flex justify-between font-bold text-xl">{title}</header>
      {/if}
      {#if message}
        <article>
          <p class="opacity-60">{message}</p>
        </article>
      {:else}
        {@render children?.()}
      {/if}
    </div>
    <FloatingArrow
      bind:ref={elemArrow}
      context={floating.context}
      fill="var(--color-{color}-200)"
    />
  </div>
{/if}
