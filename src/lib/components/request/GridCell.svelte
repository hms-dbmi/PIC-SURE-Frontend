<script lang="ts">
  export let title: string = '';
</script>

<div class="text-center border-surface-500-400-token px-4">
  <div class="border-b border-primary-500-400-token text-center mb-2">
    {title}
    <slot name="help" />
  </div>
  <slot />
</div>
