<script lang="ts" module>
  import type { Attachment } from 'svelte/attachments';

  export type TriggerType = 'click' | 'hover' | 'focus';

  const tones = {
    surface: { panel: 'bg-surface-100', arrow: 'fill-surface-100' },
    secondary: { panel: 'bg-secondary-100', arrow: 'fill-secondary-100' },
  };

  const textSizes = { sm: 'text-sm', base: '' };

  /** Spread onto the trigger element: `{#snippet trigger(props)}<Button {...props}>…` */
  export interface PopoverTriggerProps {
    [key: symbol]: Attachment<HTMLElement>;
    'aria-expanded'?: boolean;
    'aria-haspopup'?: 'dialog';
    'aria-controls'?: string;
    'aria-describedby'?: string;
    'data-testid'?: string;
    onclick?: (event: MouseEvent) => void;
    onmouseenter?: () => void;
    onmousemove?: () => void;
    onmouseleave?: () => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { fade } from 'svelte/transition';
  import {
    arrow,
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
    type Placement,
    type Side,
  } from '@floating-ui/dom';

  interface Props {
    /** `dialog` for interactive content (buttons, links); `tooltip` for text. */
    role?: 'tooltip' | 'dialog';
    /** Accessible name of a `dialog` popover. */
    label?: string;
    triggerTypes?: TriggerType[];
    placement?: Placement;
    color?: keyof typeof tones;
    textSize?: keyof typeof textSizes;
    'data-testid'?: string;
    trigger: Snippet<[PopoverTriggerProps]>;
    children: Snippet;
    /** Runs when the popover opens, and again when a click pins one that hover or focus opened. */
    onopen?: (by: TriggerType) => void;
  }

  const {
    role = 'tooltip',
    label,
    triggerTypes = ['click'],
    placement = 'top',
    color = 'surface',
    textSize = 'sm',
    'data-testid': testid = '',
    trigger,
    children,
    onopen,
  }: Props = $props();

  // The pointer must rest on the trigger this long before it opens, so a pointer passing over
  // it on its way to something else (e.g. WebKit's stepped pointer moves during an unrelated
  // click) doesn't pop it open.
  const HOVER_REST_MS = 150;

  const id = $props.id();
  let open = $state(false);
  // A popover opened by click stays open when the pointer or focus leaves; one opened by hover
  // or focus closes with it.
  let openedBy: TriggerType | undefined;
  let reference: HTMLElement | undefined = $state();
  let arrowElement: SVGSVGElement | undefined = $state();
  let panel: HTMLElement | undefined;
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  // Set when the popover closes, so the pointer still on the trigger doesn't reopen what the
  // user just dismissed; cleared when the pointer enters again.
  let hoverBlocked = false;

  function show(by: TriggerType) {
    // A click pins a popover that hover or focus opened; nothing downgrades a click-opened one.
    if (openedBy === 'click' || (open && by !== 'click')) return;
    open = true;
    openedBy = by;
    onopen?.(by);
  }

  function hide() {
    clearTimeout(hoverTimer);
    hoverBlocked = true;
    open = false;
    openedBy = undefined;
  }

  const referenceKey = createAttachmentKey();
  const attachReference: Attachment<HTMLElement> = (element) => {
    reference = element;
    return () => {
      clearTimeout(hoverTimer);
      if (reference === element) reference = undefined;
    };
  };

  const triggerProps: PopoverTriggerProps = $derived({
    [referenceKey]: attachReference,
    ...(role === 'dialog'
      ? { 'aria-haspopup': 'dialog', 'aria-expanded': open, 'aria-controls': open ? id : undefined }
      : { 'aria-describedby': open ? id : undefined }),
    ...(testid ? { 'data-testid': `${testid}-trigger` } : {}),
    ...(triggerTypes.includes('click') && {
      onclick: () => (open && openedBy === 'click' ? hide() : show('click')),
    }),
    ...(triggerTypes.includes('hover') && {
      // Not mouseenter: a trigger that appears under a still pointer isn't being hovered.
      onmouseenter: () => (hoverBlocked = false),
      onmousemove: () => {
        if (open || hoverBlocked) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => show('hover'), HOVER_REST_MS);
      },
      onmouseleave: () => {
        clearTimeout(hoverTimer);
        if (openedBy === 'hover') hide();
      },
    }),
    ...(triggerTypes.includes('focus') && {
      onfocus: (event: FocusEvent) => {
        // Like :focus-visible: a mouse press that focuses the trigger isn't a keyboard visit.
        if ((event.currentTarget as HTMLElement).matches(':focus-visible')) show('focus');
      },
      onblur: (event: FocusEvent) => {
        const next = event.relatedTarget as Node | null;
        if (openedBy === 'focus' && !panel?.contains(next)) hide();
      },
    }),
  });

  const arrowRotation: Record<Side, string> = {
    top: '',
    bottom: 'rotate(180deg)',
    left: 'rotate(-90deg)',
    right: 'rotate(90deg)',
  };

  // Positions the open popover against its trigger and closes it on Escape or a press outside.
  const floating: Attachment<HTMLElement> = (element) => {
    if (!reference) return;
    const anchor = reference;
    panel = element;

    const stopUpdates = autoUpdate(anchor, element, async () => {
      const middleware = [offset(10), flip(), shift()];
      if (arrowElement) middleware.push(arrow({ element: arrowElement }));
      const position = await computePosition(anchor, element, { placement, middleware });
      // Whole device pixels, so text and edges stay crisp
      const dpr = window.devicePixelRatio || 1;
      element.style.left = `${Math.round(position.x * dpr) / dpr}px`;
      element.style.top = `${Math.round(position.y * dpr) / dpr}px`;

      const tip = position.middlewareData.arrow;
      if (!arrowElement || !tip) return;
      const side = position.placement.split('-')[0] as Side;
      Object.assign(arrowElement.style, {
        top: '',
        right: '',
        bottom: '',
        left: tip.x != null ? `${tip.x}px` : '',
        transform: arrowRotation[side],
      });
      if (tip.y != null) arrowElement.style.top = `${tip.y}px`;
      arrowElement.style[side] = '100%';
    });

    function onKeydown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      const hadFocus = element.contains(document.activeElement);
      hide();
      if (hadFocus) anchor.focus();
    }
    function onPointerdown(event: PointerEvent) {
      const target = event.target as Node;
      if (!element.contains(target) && !anchor.contains(target)) hide();
    }
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onPointerdown);

    return () => {
      if (panel === element) panel = undefined;
      stopUpdates();
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('pointerdown', onPointerdown);
    };
  };
</script>

{@render trigger(triggerProps)}
{#if open}
  <div
    {id}
    {role}
    aria-label={role === 'dialog' ? label : undefined}
    class="popover opacity-95 {textSizes[textSize]} {tones[color].panel}"
    data-testid={testid || undefined}
    {@attach floating}
    transition:fade={{ duration: 200 }}
  >
    {@render children()}
    <svg
      bind:this={arrowElement}
      class="pointer-events-none absolute {tones[color].arrow}"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
    >
      <path d="M0,0 H14 L7,7 Z" />
    </svg>
  </div>
{/if}
