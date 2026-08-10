<script lang="ts">
  import { resolve } from '$app/paths';
  interface Props {
    title: string;
    id?: string;
    icon?: string;
    href?: string;
    subtitle?: string;
    size?: 'sm' | 'md' | 'lg' | 'other';
    disabled?: boolean;
    active?: boolean;
    'data-testid'?: string;
    class?: string;
    onclick?: () => void;
  }

  const {
    title,
    id,
    icon = '',
    href = '',
    subtitle = '',
    size = 'lg',
    disabled = false,
    active = false,
    'data-testid': testid = '',
    class: className = '',
    onclick = () => {},
  }: Props = $props();

  const cardClasses = $derived(
    `card card-btn ${size !== 'other' ? 'card-btn-' + size : ''} ${className} hover:scale-110 hover:shadow-lg`,
  );
</script>

{#snippet cardContent()}
  {#if icon}<i class="icon {icon}"></i>{/if}
  <div class="title">{title}</div>
  {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
{/snippet}

{#if href && !disabled}
  {#if href.startsWith('/')}
    <a
      href={resolve(href as '/')}
      {id}
      data-testid={testid}
      class={cardClasses}
      class:preset-filled-primary-500={active}
      class:preset-outlined-primary-500={!active}
      tabindex="0"
      {onclick}
    >
      {@render cardContent()}
    </a>
  {:else}
    <a
      {href}
      {id}
      data-testid={testid}
      target="_blank"
      rel="external"
      class={cardClasses}
      class:preset-filled-primary-500={active}
      class:preset-outlined-primary-500={!active}
      tabindex="0"
      {onclick}
    >
      {@render cardContent()}
    </a>
  {/if}
{:else}
  <button
    {id}
    data-testid={testid}
    type="button"
    class={cardClasses}
    class:preset-filled-primary-500={active}
    class:preset-outlined-primary-500={!active}
    {onclick}
    {disabled}
  >
    {@render cardContent()}
  </button>
{/if}
