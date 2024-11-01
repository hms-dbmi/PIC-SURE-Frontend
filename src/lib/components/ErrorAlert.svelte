<script lang="ts">
  export let title: string;
  export let color: string = 'error';
</script>

<aside data-testid="error-alert" class="alert variant-ghost-{color}">
  <i class="fa-solid fa-circle-exclamation text-4xl" aria-hidden="true"></i>
  <div class="alert-message">
    <h3 class="h3 text-left">{title}</h3>
    <slot />
  </div>
</aside>
