<script lang="ts">
  interface Props {
    text?: string;
    id?: string;
  }

  let { text = '', id = '' }: Props = $props();
</script>

{#if text}
  <div data-testid={id}>
    <i
      class="fa-solid fa-circle-question text-primary-800-200 hover:text-secondary-800-200 cursor-pointer"
      use:popup={{
        event: 'click',
        target: id,
        placement: 'left',
      }}
    ></i>
    <div
      data-testid="{id}-content"
      class="rounded-sm p-4 max-w-md shadow-2xl preset-filled-surface-500 text-on-primary"
      data-popup={id}
    >
      {text}
      <div class="arrow preset-filled-surface-500"></div>
    </div>
  </div>
{/if}
