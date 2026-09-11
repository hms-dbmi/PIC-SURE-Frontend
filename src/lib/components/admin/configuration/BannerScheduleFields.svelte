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

  const startInvalid = $derived(
    (!startLocal && startMissingError) ||
      restoreStartNotFuture ||
      (startLocal !== '' && resolvedStart === null),
  );
  const endBeforeStart = $derived(
    !!resolvedStart && !!resolvedEnd && Date.parse(resolvedEnd) <= Date.parse(resolvedStart),
  );
  const endInvalid = $derived(endBeforeStart || (endLocal !== '' && resolvedEnd === null));

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
        aria-invalid={startInvalid}
        aria-describedby="banner-start-help"
      />
      <div id="banner-start-help" class="text-sm text-surface-600">
        <span class="text-error-700" aria-live="polite" aria-atomic="true">
          {#if !startLocal && startMissingError}
            A published banner needs a start time.
          {:else if startResolution?.status === 'nonexistent'}
            This local time does not exist because the clock moves forward.
          {:else if startResolution?.status === 'invalid'}
            Enter a valid local date and time.
          {:else if startResolution?.status === 'ambiguous' && resolvedStart === null}
            Choose a UTC offset for this start time.
          {:else if restoreStartNotFuture}
            Start must be in the future. Leave Start blank to restore now.
          {/if}
        </span>
        {#if !startInvalid}
          {#if !startLocal}
            Server UTC when published.
          {:else if resolvedStart}
            {utcText(resolvedStart)}
          {/if}
        {/if}
      </div>
      {#if startResolution?.status === 'ambiguous'}
        <label class="mt-1 grid gap-1">
          <span class="font-bold">Start UTC offset</span>
          <select
            class="select"
            value={startChoice}
            aria-invalid={resolvedStart === null}
            aria-describedby="banner-start-help"
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
        aria-invalid={endInvalid}
        aria-describedby={endBeforeStart
          ? 'banner-end-help banner-schedule-order-error'
          : 'banner-end-help'}
      />
      <div id="banner-end-help" class="text-sm text-surface-600">
        <span class="text-error-700" aria-live="polite" aria-atomic="true">
          {#if endResolution?.status === 'nonexistent'}
            This local time does not exist because the clock moves forward.
          {:else if endResolution?.status === 'invalid'}
            Enter a valid local date and time.
          {:else if endResolution?.status === 'ambiguous' && resolvedEnd === null}
            Choose a UTC offset for this end time.
          {/if}
        </span>
        {#if !endInvalid}
          {#if !endLocal}
            No end date.
          {:else if resolvedEnd}
            {utcText(resolvedEnd)}
          {/if}
        {/if}
      </div>
      {#if endResolution?.status === 'ambiguous'}
        <label class="mt-1 grid gap-1">
          <span class="font-bold">End UTC offset</span>
          <select
            class="select"
            value={endChoice}
            aria-invalid={resolvedEnd === null}
            aria-describedby={endBeforeStart
              ? 'banner-end-help banner-schedule-order-error'
              : 'banner-end-help'}
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
  <div aria-live="polite" aria-atomic="true">
    {#if endBeforeStart}
      <p id="banner-schedule-order-error" class="mt-2 text-sm text-error-700">
        End must be after start.
      </p>
    {/if}
  </div>
</fieldset>
