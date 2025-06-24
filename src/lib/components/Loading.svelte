<script lang="ts">
  import { Progress, ProgressRing } from '@skeletonlabs/skeleton-svelte';

  const {
    size = 'small',
    ring = true,
    label = '',
    color = 'primary',
  }: {
    size?: 'micro' | 'mini' | 'small' | 'medium' | 'large';
    ring?: boolean;
    label?: string;
    color?: string;
  } = $props();

  const sizes = {
    micro: 'size-4',
    mini: 'size-8',
    small: 'size-16',
    medium: 'size-32',
    large: 'size-64',
  };

  // This has to be mapped for tailwind to pick up the colors
  // https://tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names
  const variants: { [key: string]: { meter: string; track: string; bg: string } } = {
    primary: {
      meter: 'stroke-primary-500',
      track: 'stroke-primary-500/30',
      bg: 'bg-primary-500',
    },
    secondary: {
      meter: 'stroke-secondary-500',
      track: 'stroke-secondary-500/30',
      bg: 'bg-secondary-500',
    },
    tertiary: {
      meter: 'stroke-tertiary-500',
      track: 'stroke-tertiary-500/30',
      bg: 'bg-tertiary-500',
    },
    info: {
      meter: 'stroke-info-500',
      track: 'stroke-info-500/30',
      bg: 'bg-info-500',
    },
    error: {
      meter: 'stroke-error-500',
      track: 'stroke-error-500/30',
      bg: 'bg-error-500',
    },
    success: {
      meter: 'stroke-success-500',
      track: 'stroke-success-500/30',
      bg: 'bg-success-500',
    },
    warning: {
      meter: 'stroke-warning-500',
      track: 'stroke-warning-500/30',
      bg: 'bg-warning-500',
    },
    white: {
      meter: 'stroke-white',
      track: 'stroke-white/30',
      bg: 'bg-white',
    },
    black: {
      meter: 'stroke-black',
      track: 'stroke-black/30',
      bg: 'bg-black',
    },
  };
</script>

{#if ring}
  <div class="flex justify-center">
    <ProgressRing
      value={null}
      meterStroke={variants[color].meter}
      trackStroke={variants[color].track}
      size={sizes[size]}
      classes={size === 'micro' ? 'm-1' : ''}
    >
      {#if label && size !== 'micro'}
        <span class="h4">{label}</span>
      {/if}
    </ProgressRing>
    {#if label && size === 'micro'}
      <span class="bold">{label}</span>
    {/if}
  </div>
{:else}
  <Progress
    value={null}
    meterBg={variants[color].bg}
    meterAnimate="anim-progress-bar"
    labelText="h3"
  >
    {#if label}{label}{/if}
  </Progress>
{/if}
