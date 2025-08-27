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
    useFocus,
    useHover,
    useFloating,
    useInteractions,
    useRole,
  } from '@skeletonlabs/floating-ui-svelte';
  import { fade } from 'svelte/transition';
  import { shift, type Placement } from '@floating-ui/dom';

  export type TriggerType = 'click' | 'hover' | 'focus' | 'manual';
  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    triggerStyle?: string;
    triggerTypes?: string[];
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
    triggerTypes = ['click'],
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
  const role = useRole(floating.context, { role: 'tooltip' });
  const dismiss = useDismiss(floating.context);
  let interactionsToUse = [role, dismiss];

  if (triggerTypes.includes('hover')) {
    const hover = useHover(floating.context, { move: false });
    interactionsToUse.push(hover);
  }

  if (triggerTypes.includes('click')) {
    const click = useClick(floating.context);
    interactionsToUse.push(click);
  }

  if (triggerTypes.includes('focus')) {
    const focus = useFocus(floating.context);
    interactionsToUse.push(focus);
  }
  const interactions = useInteractions(interactionsToUse);
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
    aria-label={title || 'Help popover'}
    style="background-color: var(--color-{color}-100); opacity: 0.90;{floating.floatingStyles}"
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
