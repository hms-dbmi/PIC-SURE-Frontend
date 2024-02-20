<script lang="ts">
  export let title: string;
</script>

<aside data-testid="error-alert" class="alert bg-error-100 text-on-error-token">
  <i class="fa-solid fa-triangle-exclamation text-4xl" />
  <div class="alert-message">
    <h3 class="h3 text-left">{title}</h3>
    <slot />
  </div>
</aside>
