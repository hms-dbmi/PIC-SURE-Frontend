<script lang="ts">
  import { goto } from '$app/navigation';
  interface Props {
    title: string;
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

  function clickEvent() {
    if (href && href.startsWith('/')) {
      goto(href);
    } else if (href) {
      window.open(href, '_blank');
    } else {
      onclick();
    }
  }
</script>

<button
  data-testid={testid}
  type="button"
  class={`card card-btn ${size !== 'other' ? 'card-btn-' + size : ''} ${className}`}
  class:preset-filled-primary-500={active}
  class:preset-outlined-primary-500={!active}
  onclick={clickEvent}
  {disabled}
>
  {#if icon}<i class="icon {icon}"></i>{/if}
  <div class="title">{title}</div>
  {#if subtitle && !['sm', 'md'].includes(size)}<div class="subtitle">{subtitle}</div>{/if}
</button>
