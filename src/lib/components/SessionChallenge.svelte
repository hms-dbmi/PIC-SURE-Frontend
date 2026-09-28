<script lang="ts">
  import { onMount } from 'svelte';
  import { attachChallengeContainer, challengeState } from '$lib/sessionChallenge';
  import { retryOpenSession } from '$lib/openSession';

  // part of the app shell, empty and taking no space until Cloudflare needs an interaction; an
  // off-screen or hidden widget couldn't be clicked by the visitors who need it
  let container: HTMLElement | undefined = $state();
  let panel: HTMLElement | undefined = $state();

  let active = $derived($challengeState !== 'idle');

  onMount(() => {
    if (container) return attachChallengeContainer(container);
  });

  // the panel sits after all page content; take keyboard and screen-reader users to it
  $effect(() => {
    if ($challengeState === 'interactive') panel?.focus();
  });
</script>

<div
  data-testid="session-challenge"
  bind:this={panel}
  class={active
    ? 'card fixed left-1/2 bottom-6 z-[1000] -translate-x-1/2 preset-tonal-surface border border-surface-500 p-4 flex flex-col items-center gap-2'
    : ''}
  role={active ? 'region' : undefined}
  aria-label={active ? 'Browser check' : undefined}
  tabindex="-1"
>
  {#if $challengeState === 'interactive'}
    <p class="text-sm" role="status">Confirm you're human to keep browsing</p>
  {/if}
  <div data-testid="session-challenge-widget" bind:this={container}></div>
  {#if $challengeState === 'error' || $challengeState === 'unsupported'}
    <p class="text-sm" role="alert">
      {$challengeState === 'unsupported'
        ? "This browser can't complete the check needed for anonymous browsing. Try another browser, or log in."
        : "We couldn't confirm you're human, so some data may not load."}
    </p>
    <button type="button" class="btn preset-filled-primary-500" onclick={() => retryOpenSession()}
      >Try again</button
    >
  {/if}
</div>
