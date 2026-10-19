<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    buttonClass,
    isExternalHref,
    type ButtonSize,
    type ButtonVariant,
  } from '#lib/ui/button.ts';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Renders a link. Resolve internal paths first. */
    href?: string;
    target?: string;
    rel?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean | null;
    class?: string;
    'data-testid'?: string;
    children: Snippet;
  }

  const {
    variant = 'filled',
    size = 'md',
    href,
    target,
    rel,
    class: className = '',
    type = 'button',
    disabled = false,
    children,
    ...rest
  }: Props = $props();

  // aria-disabled looks disabled but stays focusable and hoverable, e.g. to show why in a popover.
  const ariaDisabled = $derived(rest['aria-disabled'] === true || rest['aria-disabled'] === 'true');
  const classes = $derived(
    `${buttonClass(variant, size)} ${ariaDisabled ? 'disabled cursor-not-allowed' : ''} ${className}`,
  );
</script>

<!-- <a> has no disabled state, so a disabled link renders as a disabled button. -->
{#if href && !disabled}
  <a
    {...rest}
    {href}
    {target}
    rel={rel ?? (isExternalHref(href) ? 'external' : undefined)}
    class={classes}
  >
    {@render children()}
  </a>
{:else}
  <button {...rest} {type} {disabled} class={classes}>
    {@render children()}
  </button>
{/if}
