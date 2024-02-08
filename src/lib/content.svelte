<script lang="ts">
  export let title = 'Unknown page title';
</script>

<section class="main-content">
  <h1 class="h1 mb-4">
    {title}
  </h1>
  <slot />
</section>
