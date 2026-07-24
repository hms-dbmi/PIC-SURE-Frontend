<script lang="ts">
  import { resolve } from '$app/paths';
  interface Props {
    href?: string;
    angle?: 'right' | 'left';
    variant?: string;
    color?: string;
    disabled?: boolean;
    name?: string;
    'data-testid'?: string;
    class?: string;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  const {
    href = '',
    angle = 'left',
    variant = 'tonal',
    color = 'primary',
    disabled = false,
    name = '',
    'data-testid': testid = '',
    class: className = '',
    onclick = () => {},
    children,
  }: Props = $props();

  const btnStyle = $derived(
    `btn btn-sm h-fit border preset-${variant}-${color} hover:preset-filled-${color}-500 text-lg`,
  );
  const clean_testid = $derived(testid || name.replaceAll(' ', '-').toLowerCase() + '-btn');
</script>

{#snippet label()}
  {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
  {@render children?.()}
  {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
{/snippet}

{#if href}
  {#if href.startsWith('/')}
    <a
      data-testid={clean_testid}
      aria-disabled={disabled}
      class="{btnStyle} &[aria-disabled=“true”]:opacity-75 {className}"
      href={resolve(href as '/')}
    >
      {@render label()}
    </a>
  {:else}
    <a
      data-testid={clean_testid}
      aria-disabled={disabled}
      class="{btnStyle} &[aria-disabled=“true”]:opacity-75 {className}"
      rel="external"
      {href}
    >
      {@render label()}
    </a>
  {/if}
{:else}
  <button
    data-testid={clean_testid}
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
