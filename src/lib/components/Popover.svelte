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
    type ElementProps,
    type FloatingContext,
  } from '@skeletonlabs/floating-ui-svelte';
  import { fade } from 'svelte/transition';
  import { shift, type Placement } from '@floating-ui/dom';
  import { sanitizeHTML } from '$lib/utilities/HTML';

  export type TriggerType = 'click' | 'hover' | 'focus' | 'manual';
  interface Props {
    open?: boolean;
    title?: string;
    message?: string;
    triggerStyle?: string;
    triggerTypes?: string[];
    triggerDisabled?: boolean;
    placement?: Placement;
    color?: string;
    size?: string;
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
    triggerDisabled = false,
    placement = 'top',
    color = 'surface',
    size = 'text-sm',
    'data-testid': testid = '',
    trigger,
    children,
    onengage = () => {},
  }: Props = $props();

  let elemArrow: HTMLElement | null = $state(null);

  // Use Floating
  const floating = $derived(
    useFloating({
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
    }),
  );

  function getHover(context: FloatingContext): ElementProps | undefined {
    if (triggerTypes.includes('hover')) {
      return useHover(context, { move: false });
    }
    return undefined;
  }

  function getClick(context: FloatingContext): ElementProps | undefined {
    if (triggerTypes.includes('click')) {
      return useClick(context);
    }
    return undefined;
  }

  function getFocus(context: FloatingContext): ElementProps | undefined {
    if (triggerTypes.includes('focus')) {
      return useFocus(context);
    }
    return undefined;
  }

  // Interactions
  let interactionsToUse = $derived(
    [
      useRole(floating.context, { role: 'tooltip' }),
      useDismiss(floating.context),
      getHover(floating.context),
      getClick(floating.context),
      getFocus(floating.context),
    ].filter((x) => x !== undefined),
  );

  const interactions = $derived(useInteractions(interactionsToUse));
</script>

<button
  bind:this={floating.elements.reference}
  data-testid="{testid}-btn"
  class="cursor-pointer {triggerStyle}"
  {...interactions.getReferenceProps()}
  disabled={triggerDisabled}
>
  {@render trigger?.()}
</button>
{#if open}
  <div
    bind:this={floating.elements.floating}
    class="popover {size}"
    aria-label={title || 'Help popover'}
    style="background-color: var(--color-{color}-100); opacity: 0.95;{floating.floatingStyles}"
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
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html sanitizeHTML(message)}
        </article>
      {:else}
        {@render children?.()}
      {/if}
    </div>
    <FloatingArrow
      bind:ref={elemArrow}
      context={floating.context}
      fill="var(--color-{color}-100)"
    />
  </div>
{/if}
