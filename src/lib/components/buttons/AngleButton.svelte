<script lang="ts">
  import { resolve } from '$app/paths';
  import { appPath } from '#lib/paths.ts';
  interface Props {
    href?: string;
    angle?: 'right' | 'left';
    variant?: 'tonal' | 'filled';
    disabled?: boolean;
    'data-testid'?: string;
    class?: string;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  const {
    href = '',
    angle = 'left',
    variant = 'tonal',
    disabled = false,
    'data-testid': testid,
    class: className = '',
    onclick = () => {},
    children,
  }: Props = $props();

  const variants = {
    tonal: 'preset-tonal-primary hover:preset-filled-primary-500',
    filled: 'preset-filled-primary-500',
  };
  const btnStyle = $derived(`btn btn-sm h-fit border ${variants[variant]} text-lg`);
</script>

{#snippet label()}
  {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
  {@render children?.()}
  {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
{/snippet}

{#if href}
  {#if href.startsWith('/')}
    <a
      data-testid={testid}
      aria-disabled={disabled}
      class="{btnStyle} {className}"
      href={resolve(appPath(href))}
    >
      {@render label()}
    </a>
  {:else}
    <a
      data-testid={testid}
      aria-disabled={disabled}
      class="{btnStyle} {className}"
      rel="external"
      {href}
    >
      {@render label()}
    </a>
  {/if}
{:else}
  <button
    data-testid={testid}
    type="button"
    class="{btnStyle} disabled:opacity-75 {className}"
    {onclick}
    {disabled}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    {@render children?.()}
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </button>
{/if}
