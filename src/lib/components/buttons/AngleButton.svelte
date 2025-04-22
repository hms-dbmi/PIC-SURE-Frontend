<script lang="ts">
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
    variant = 'filled',
    color = 'primary',
    disabled = false,
    name = '',
    'data-testid': testid = '',
    class: className = '',
    onclick = () => {},
    children,
  }: Props = $props();

  const btnStyle = `btn btn-sm h-fit variant-${variant}-${color} ${variant !== 'filled' ? `hover:variant-filled-${color}` : ''} text-lg`;
  const clean_testid = testid || name.replaceAll(' ', '-').toLowerCase() + '-btn';
</script>

{#if href}
  <a
    data-testid={clean_testid}
    aria-disabled={disabled}
    class="{btnStyle} &[aria-disabled=“true”]:opacity-75 {className}"
    rel={disabled ? 'nofollow' : ''}
    {href}
  >
    {#if angle === 'left'}<i class="fa-solid fa-arrow-left mr-3"></i>{/if}
    {@render children?.()}
    {#if angle === 'right'}<i class="fa-solid fa-arrow-right ml-3"></i>{/if}
  </a>
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
