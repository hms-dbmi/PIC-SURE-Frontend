<script lang="ts">
  import { onMount } from 'svelte';

  const STORAGE_KEY = 'site-banner-si-terminology-dismissed';

  // Hidden until mounted so visitors who already dismissed it don't see a flash.
  let dismissed = $state(true);

  onMount(() => {
    try {
      dismissed = window.sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      dismissed = false;
    }
  });

  function dismiss() {
    dismissed = true;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      return;
    }
  }
</script>

{#if !dismissed}
  <section
    aria-labelledby="site-banner-title"
    data-testid="site-banner"
    class="w-full flex-none border-b-4 px-4 py-1.5 preset-tonal-primary border-primary-500"
  >
    <div class="site-banner-layout mx-auto grid w-full items-center gap-3">
      <div
        class="site-banner-message flex min-w-0 max-w-full items-center gap-3 justify-self-center text-left"
      >
        <i class="fa-solid fa-circle-info flex-none text-lg" aria-hidden="true"></i>
        <div class="min-w-0">
          <h2 id="site-banner-title" class="site-banner-title">NIH Websites Are Changing</h2>
          <p class="site-banner-content text-sm leading-5">
            Per <a
              href="https://www.whitehouse.gov/presidential-actions/2026/09/inaugurating-the-era-of-super-intelligence/"
              target="_blank"
              rel="noopener noreferrer">Executive Order 14434</a
            >, federal agencies are now using "Super Intelligence" (SI) in place of "Artificial
            Intelligence" (AI). You may see both terms across NIH content during this transition.
          </p>
        </div>
      </div>
      <button
        type="button"
        class="site-banner-dismiss flex h-11 w-11 flex-none items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current"
        aria-label="Dismiss NIH Websites Are Changing"
        title="Dismiss NIH Websites Are Changing"
        onclick={dismiss}
      >
        <span
          class="flex h-8 w-8 items-center justify-center rounded-full border border-current"
          aria-hidden="true"
        >
          <i class="fa-solid fa-xmark text-sm"></i>
        </span>
      </button>
    </div>
  </section>
{/if}

<style>
  .site-banner-layout {
    grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
  }

  .site-banner-message {
    grid-column: 2;
  }

  .site-banner-dismiss {
    box-sizing: border-box;
    padding: 0;
  }

  .site-banner-title {
    margin: 0 0 0.125rem;
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25rem;
  }

  .site-banner-content {
    margin: 0;
  }

  .site-banner-content a {
    color: inherit;
    font-weight: 650;
    text-decoration: underline;
  }
</style>
