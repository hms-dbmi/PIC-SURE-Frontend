<script lang="ts">
  import Popover from '$lib/components/Popover.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    text?: string;
    id?: string;
    children?: Snippet;
  }

  const { text, id = '', children }: Props = $props();
</script>

{#if text || children}
  <div data-testid={id}>
    <Popover data-testid="{id}-content" triggerTypes={['click', 'hover']}>
      {#snippet trigger()}
        <i class="fa-solid fa-circle-question text-primary-800-200 hover:text-secondary-800-200"
        ></i>
      {/snippet}
      {#if children}
        {@render children?.()}
      {:else if text}
        {text}
      {/if}
    </Popover>
  </div>
{/if}
