<script lang="ts">
  interface Props {
    title: string;
    color?: string;
    children?: import('svelte').Snippet;
  }

  let { title, color = 'error', children }: Props = $props();
</script>

<aside data-testid="error-alert" class="alert preset-tonal border border-surface-500-{color}">
  <i class="fa-solid fa-circle-exclamation text-4xl" aria-hidden="true"></i>
  <div class="alert-message">
    <h3 class="h3 text-left">{title}</h3>
    {@render children?.()}
  </div>
</aside>
