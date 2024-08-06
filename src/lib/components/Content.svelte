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
  <div class="flex items-center">
    {#if backUrl}<AngleButton name="back" class="my-2 mr-8" on:click={onBack}
        >{backTitle}</AngleButton
      >{/if}
    {#if title}<h1 class="my-4">{title}</h1>{/if}
  </div>
  {#if subtitle}<h2 class="subtitle mb-4">{subtitle}</h2>{/if}
  <slot />
</section>
