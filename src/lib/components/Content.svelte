<script lang="ts">
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  import { goto } from '$app/navigation';
  import { fly } from 'svelte/transition';

  export let title: string = '';
  export let subtitle: string = '';
  export let backUrl: string = '';
  export let backAction: () => void = () => {};
  export let backTitle: string = 'Back';
  export let full = false;
  export let transition = false;

  function onBack() {
    backAction();
    goto(backUrl);
  }
</script>

<section
  class={`main-content ${full ? 'w-full' : ''} ${$$props.class ?? ''}`}
  in:fly={{ duration: 300, x: transition ? '100%' : '0' }}
>
  {#if backUrl}<AngleButton name="back" on:click={onBack}>{backTitle}</AngleButton>{/if}
  {#if title}<h1 class="{backUrl ? 'mb-4' : 'my-4'} text-center">{title}</h1>{/if}
  {#if subtitle}<p class="subtitle mb-4">{subtitle}</p>{/if}
  <slot />
</section>
