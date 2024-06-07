<script lang="ts">
  import AngleButton from '$lib/components/buttons/AngleButton.svelte';

  import { goto } from '$app/navigation';

  export let title: string = '';
  export let subtitle: string = '';
  export let backUrl: string = '';
  export let backTitle: string = 'Back';
  export let full = false;
</script>

<section class={`main-content ${full ? 'w-full' : ''}`}>
  {#if backUrl}<AngleButton name="back" class="my-2" on:click={() => goto(backUrl)}
      >{backTitle}</AngleButton
    >{/if}
  {#if title}<h1 class="mb-4">{title}</h1>{/if}
  {#if subtitle}<p class="subtitle mb-4">{subtitle}</p>{/if}
  <slot />
</section>
