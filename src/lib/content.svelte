<script lang="ts">
  export let title = 'Unknown page title';
  export let subtitle: string;
</script>

<section class="main-content">
  <h1 class="h1 mb-4 text-center">
    {title}
  </h1>
  {#if subtitle}<p class="subtitle mb-4 text-center">{subtitle}</p>{/if}
  <slot />
</section>
