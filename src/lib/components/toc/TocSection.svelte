<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    id: string;
    tinted?: boolean;
    children: Snippet;
  }

  const { id, tinted = false, children }: Props = $props();
</script>

<section {id} class="w-full {tinted ? 'bg-primary-50-950' : ''}">
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-8">
    <div class="xl:pr-[calc(var(--toc-rail-width)+var(--toc-rail-gap))]">
      {@render children()}
    </div>
  </div>
</section>
