<script lang="ts">
  export let title: string = '';
  export let subtitle: string = '';
  export let full = false;
</script>

<section class={`main-content ${full && 'w-full'}`}>
  {#if title}<h1 class="mb-4">{title}</h1>{/if}
  {#if subtitle}<p class="subtitle mb-4 text-center">{subtitle}</p>{/if}
  <slot />
</section>
