<script lang="ts">
  import { tick } from 'svelte';
  import type { BannerPageTarget } from '$lib/models/Banner';

  type TargetedPage = Exclude<BannerPageTarget, { kind: 'ALL' }>;

  interface Props {
    allPages: boolean;
    pageTargets: TargetedPage[];
    errors: (string | null)[];
  }

  let { allPages = $bindable(), pageTargets = $bindable(), errors }: Props = $props();

  let fields = $state<HTMLFieldSetElement>();
  let addButton = $state<HTMLButtonElement>();

  async function addPageTarget() {
    const index = pageTargets.length;
    pageTargets = [...pageTargets, { kind: 'EXACT', path: '' }];
    await tick();
    fields?.querySelector<HTMLInputElement>(`#banner-page-target-${index}-path`)?.focus();
  }

  async function removePageTarget(index: number) {
    pageTargets = pageTargets.filter((_, targetIndex) => targetIndex !== index);
    await tick();
    if (!fields) return;
    const paths = fields.querySelectorAll<HTMLInputElement>('input[type="text"]');
    (paths[Math.min(index, paths.length - 1)] ?? addButton)?.focus();
  }

  function updatePageTarget(index: number, target: TargetedPage) {
    pageTargets = pageTargets.map((current, targetIndex) =>
      targetIndex === index ? target : current,
    );
  }
</script>

<fieldset bind:this={fields} class="mt-5 border-t border-surface-300 pt-4">
  <legend class="font-bold">Pages</legend>
  <p class="mt-1 text-sm text-surface-600">
    Match application pathnames. Query strings and fragments are ignored.
  </p>
  <div class="mt-3 flex flex-wrap gap-6">
    <label class="flex items-center gap-2">
      <input type="radio" name="page-target-mode" value={true} bind:group={allPages} />
      All pages
    </label>
    <label class="flex items-center gap-2">
      <input type="radio" name="page-target-mode" value={false} bind:group={allPages} />
      Specific pages
    </label>
  </div>

  {#if !allPages}
    <div class="mt-4 grid gap-4">
      {#each pageTargets as target, index}
        <div class="grid gap-2 rounded border border-surface-300 p-3 sm:grid-cols-[12rem_1fr_auto]">
          <label class="grid content-start gap-1">
            <span class="font-bold">Target {index + 1} type</span>
            <select
              class="select"
              value={target.kind}
              onchange={(event) =>
                updatePageTarget(index, {
                  kind: event.currentTarget.value as TargetedPage['kind'],
                  path: target.path,
                })}
            >
              <option value="EXACT">Exact page</option>
              <option value="SUBTREE">Page and subtree</option>
              <option value="PARAMETERIZED">Parameterized route</option>
            </select>
          </label>
          <div class="grid content-start gap-1">
            <label class="font-bold" for={`banner-page-target-${index}-path`}>
              Target {index + 1} path
            </label>
            <input
              id={`banner-page-target-${index}-path`}
              class="input"
              type="text"
              placeholder="/help"
              value={target.path}
              aria-invalid={!!errors[index]}
              aria-describedby={errors[index] ? `banner-page-target-${index}-error` : undefined}
              oninput={(event) =>
                updatePageTarget(index, { ...target, path: event.currentTarget.value })}
            />
            <span
              id={`banner-page-target-${index}-error`}
              class="text-sm text-error-700"
              aria-live="polite"
              aria-atomic="true">{errors[index] ?? ''}</span
            >
          </div>
          <button
            type="button"
            class="btn preset-tonal-error self-start sm:mt-7"
            aria-label={`Remove target ${index + 1}`}
            onclick={() => removePageTarget(index)}
          >
            Remove
          </button>
        </div>
      {/each}
      <div aria-live="polite" aria-atomic="true">
        {#if pageTargets.length === 0}
          <p class="text-sm text-error-700">Add at least one page target.</p>
        {/if}
      </div>
      <button
        type="button"
        class="btn preset-tonal-primary justify-self-start"
        bind:this={addButton}
        onclick={addPageTarget}
      >
        Add page target
      </button>
    </div>
  {/if}
</fieldset>
