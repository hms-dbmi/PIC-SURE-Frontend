<script lang="ts">
  import { warningMessageClass } from '#lib/ui/surface.ts';

  interface Props {
    title?: string;
    color?: 'error' | 'warning' | 'secondary';
    solid?: boolean;
    icon?: boolean;
    iconSize?: '4xl' | '2xl' | 'lg';
    closeText?: string;
    'data-testid'?: string;
    onclose?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    title,
    color = 'error',
    solid = false,
    icon = true,
    iconSize = '4xl',
    closeText = 'Close',
    'data-testid': testid = 'ui-error-alert',
    onclose,
    children,
  }: Props = $props();

  const presets = {
    error: { tonal: 'preset-tonal-error', filled: 'preset-filled-error-500' },
    warning: { tonal: warningMessageClass, filled: 'preset-filled-warning-500' },
    secondary: { tonal: 'preset-tonal-secondary', filled: 'preset-filled-secondary-500' },
  };
  const iconSizes = { '4xl': 'text-4xl', '2xl': 'text-2xl', lg: 'text-lg' };
</script>

<aside
  data-testid={testid}
  class="card flex gap-4 {presets[color][solid ? 'filled' : 'tonal']} py-2 px-3 m-2"
>
  {#if icon}<i
      class="fa-solid fa-circle-exclamation {iconSizes[iconSize]} content-center"
      aria-hidden="true"
    ></i>{/if}
  <div class="alert-message content-center">
    {#if title}<h3 class="h3 text-left">{title}</h3>{/if}
    {@render children?.()}
    {#if onclose}
      <div class="alert-actions">
        <button onclick={onclose}>
          <i class="fa-solid fa-xmark"></i>
          <span class="sr-only">{closeText}</span>
        </button>
      </div>
    {/if}
  </div>
</aside>
