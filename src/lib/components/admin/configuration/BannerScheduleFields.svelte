<script lang="ts">
  import type { LocalMinuteResolution } from '$lib/utilities/BannerSchedule';

  interface Props {
    startLocal: string;
    endLocal: string;
    startChoice: string;
    endChoice: string;
    startResolution: LocalMinuteResolution | null;
    endResolution: LocalMinuteResolution | null;
    resolvedStart: string | null;
    resolvedEnd: string | null;
    disabled: boolean;
    description: string;
    startMissingError: boolean;
    restoreStartNotFuture: boolean;
  }

  let {
    startLocal = $bindable(),
    endLocal = $bindable(),
    startChoice = $bindable(),
    endChoice = $bindable(),
    startResolution,
    endResolution,
    resolvedStart,
    resolvedEnd,
    disabled,
    description,
    startMissingError,
    restoreStartNotFuture,
  }: Props = $props();

  function utcText(instant: string) {
    return `Resolved UTC: ${instant.slice(0, 16).replace('T', ' ')} UTC`;
  }
</script>

<fieldset {disabled}>
  <legend class="font-bold">Schedule</legend>
  <p class="mt-1 text-sm text-surface-600">{description}</p>
  <div class="mt-3 grid gap-4 sm:grid-cols-2">
    <div class="grid content-start gap-1">
      <label class="font-bold" for="banner-start">Start</label>
      <input
        id="banner-start"
        class="input"
        type="datetime-local"
        step="60"
        bind:value={startLocal}
        aria-describedby="banner-start-help"
      />
      <div id="banner-start-help" class="text-sm text-surface-600">
        {#if !startLocal}
          {#if startMissingError}
            <span class="text-error-700">A published banner needs a start time.</span>
          {:else}
            Server UTC when published.
          {/if}
        {:else if startResolution?.status === 'nonexistent'}
          <span class="text-error-700">
            This local time does not exist because the clock moves forward.
          </span>
        {:else if startResolution?.status === 'invalid'}
          <span class="text-error-700">Enter a valid local date and time.</span>
        {:else if restoreStartNotFuture}
          <span class="text-error-700" role="alert">
            Start must be in the future. Leave Start blank to restore now.
          </span>
        {:else if resolvedStart}
          {utcText(resolvedStart)}
        {/if}
      </div>
      {#if startResolution?.status === 'ambiguous'}
        <label class="mt-1 grid gap-1">
          <span class="font-bold">Start UTC offset</span>
          <select
            class="select"
            value={startChoice}
            onchange={(event) => (startChoice = event.currentTarget.value)}
          >
            <option value="">Choose an offset</option>
            {#each startResolution.options as option}
              <option value={option.instant}>UTC{option.offset}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
    <div class="grid content-start gap-1">
      <label class="font-bold" for="banner-end">End</label>
      <input
        id="banner-end"
        class="input"
        type="datetime-local"
        step="60"
        bind:value={endLocal}
        aria-describedby="banner-end-help"
      />
      <div id="banner-end-help" class="text-sm text-surface-600">
        {#if !endLocal}
          No end date.
        {:else if endResolution?.status === 'nonexistent'}
          <span class="text-error-700">
            This local time does not exist because the clock moves forward.
          </span>
        {:else if endResolution?.status === 'invalid'}
          <span class="text-error-700">Enter a valid local date and time.</span>
        {:else if resolvedEnd}
          {utcText(resolvedEnd)}
        {/if}
      </div>
      {#if endResolution?.status === 'ambiguous'}
        <label class="mt-1 grid gap-1">
          <span class="font-bold">End UTC offset</span>
          <select
            class="select"
            value={endChoice}
            onchange={(event) => (endChoice = event.currentTarget.value)}
          >
            <option value="">Choose an offset</option>
            {#each endResolution.options as option}
              <option value={option.instant}>UTC{option.offset}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  </div>
  {#if resolvedStart && resolvedEnd && resolvedEnd <= resolvedStart}
    <p class="mt-2 text-sm text-error-700">End must be after start.</p>
  {/if}
</fieldset>
