<script lang="ts">
  import { popup } from '@skeletonlabs/skeleton';

  export let text: string = '';
  export let id: string = '';
</script>

{#if text}
  <i
    class="fa-solid fa-circle-question fa-sm text-tertiary-700-200-token"
    use:popup={{
      event: 'click',
      target: id,
      placement: 'left',
    }}
  ></i>
  <div
    class="rounded p-4 max-w-md shadow-2xl variant-filled-surface text-on-primary"
    data-popup={id}
  >
    {text}
    <div class="arrow variant-filled-surface" />
  </div>
{/if}
