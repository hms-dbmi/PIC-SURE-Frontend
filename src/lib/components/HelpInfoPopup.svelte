<script lang="ts">
  import { popup } from '@skeletonlabs/skeleton';

  export let text: string = '';
  export let id: string = '';
</script>

{#if text}
  <div data-testid={id}>
    <i
      class="fa-solid fa-circle-question text-primary-700-200-token hover:text-secondary-700-200-token cursor-pointer"
      use:popup={{
        event: 'click',
        target: id,
        placement: 'left',
      }}
    ></i>
    <div
      data-testid="{id}-content"
      class="rounded p-4 max-w-md shadow-2xl variant-filled-surface text-on-primary"
      data-popup={id}
    >
      {text}
      <div class="arrow variant-filled-surface"></div>
    </div>
  </div>
{/if}
