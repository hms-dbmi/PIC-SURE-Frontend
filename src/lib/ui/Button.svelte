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
    /** Renders a link. Resolve internal paths first; an href with a scheme gets rel="external". */
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

  const classes = $derived(`${buttonClass(variant, size)} ${className}`);
</script>

<!-- A disabled link can't be disabled, so it renders as a disabled button instead. -->
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
