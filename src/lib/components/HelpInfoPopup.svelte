<script lang="ts">
  import Popover from '$lib/components/Popover.svelte';

  interface Props {
    text?: string;
    id?: string;
  }

  const { text = '', id = '' }: Props = $props();
</script>

{#if text}
  <div data-testid={id}>
    <Popover data-testid="{id}-content">
      {#snippet trigger()}
        <i class="fa-solid fa-circle-question text-primary-800-200 hover:text-secondary-800-200"
        ></i>
      {/snippet}
      {text}
    </Popover>
  </div>
{/if}
