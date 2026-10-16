<script lang="ts">
  import type { Snippet } from 'svelte';
  import OnThisPage, { type TocEntry } from './OnThisPage.svelte';

  interface Props {
    entries: TocEntry[];
    hero: Snippet;
    children: Snippet;
    onselect?: (id: string) => void;
  }

  const { entries, hero, children, onselect }: Props = $props();
</script>

<div class="toc-layout w-full">
  <header
    class="w-full bg-linear-to-r border-b border-primary-200-800 from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900"
  >
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-8">
      {@render hero()}
    </div>
  </header>
  <div class="relative">
    {@render children()}
    <div class="pointer-events-none absolute inset-0 hidden xl:block">
      <div class="mx-auto flex h-full max-w-7xl justify-end px-4 sm:px-8">
        <div class="pointer-events-auto w-(--toc-rail-width)">
          <div class="sticky top-0 pt-12">
            <OnThisPage {entries} {onselect} />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .toc-layout {
    --toc-rail-width: 14rem;
    --toc-rail-gap: 2rem;
  }
</style>
