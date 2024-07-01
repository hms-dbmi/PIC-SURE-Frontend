<script lang="ts">
  export let title: string;
</script>

<aside data-testid="error-alert" class="alert variant-filled-error">
  <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
  <div class="alert-message">
    <h3 class="h3 text-left">{title}</h3>
    <slot />
  </div>
</aside>
