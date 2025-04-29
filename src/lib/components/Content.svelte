<script lang="ts">
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';

  interface Props {
    title?: string;
    subtitle?: string;
    backUrl?: string;
    backTitle?: string;
    full?: boolean;
    transition?: boolean;
    class?: string;
    backAction?: () => void;
    children?: import('svelte').Snippet;
  }

  const {
    full = false,
    transition = true,
    title = '',
    subtitle = '',
    backUrl = '',
    backTitle = 'Back',
    class: className = '',
    backAction = () => {},
    children,
  }: Props = $props();

  function onBack() {
    backAction();
    goto(backUrl);
  }
</script>

<section
  class={`main-content ${full ? 'w-full' : ''} pb-6 ${className}`}
  in:fly={{ duration: 300, x: transition ? '100%' : '0' }}
>
  {#if backUrl}<AngleButton name="back" onclick={onBack}>{backTitle}</AngleButton>{/if}
  {#if title}<h1 class="{backUrl ? 'mb-4' : 'my-4'} text-center">{title}</h1>{/if}
  {#if subtitle}<p class="subtitle mb-4 text-center">{subtitle}</p>{/if}
  {@render children?.()}
</section>
