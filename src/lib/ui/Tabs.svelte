<script lang="ts" module>
  export interface Tab<T extends string = string> {
    value: T;
    label: string;
  }

  export type TabsVariant = 'page' | 'section';
</script>

<script lang="ts" generics="T extends string">
  import { tick, type Snippet } from 'svelte';

  interface Props {
    tabs: readonly Tab<T>[];
    /** The selected tab. Tabs never selects on its own: `onchange` asks, the owner decides. */
    value: T;
    /** `focus` is true for keyboard selection, so an owner that defers the change can refocus. */
    onchange: (value: T, options: { focus: boolean }) => void;
    /** Names the tablist for screen readers. */
    label: string;
    variant?: TabsVariant;
    class?: string;
    /** Also prefixes the list, tab and panel testids (`{testid}-control`, …). */
    'data-testid'?: string;
    /** Tab content; defaults to the label. The tab's accessible name comes from this. */
    tab?: Snippet<[Tab<T>]>;
    /** Rendered once per tab; hidden panels stay mounted. */
    panel: Snippet<[T]>;
  }

  let {
    tabs,
    value,
    onchange,
    label,
    variant = 'page',
    class: className = '',
    'data-testid': testid = 'ui-tabs',
    tab: tabContent,
    panel,
  }: Props = $props();

  const id = $props.id();
  const buttons: HTMLButtonElement[] = $state([]);

  const styles = {
    page: {
      list: 'flex justify-start gap-2 mb-4 border-b-[1px] border-surface-200-800',
      tab: 'border-b-[1px] border-transparent pb-2 translate-y-[1px]',
      active: 'border-b-surface-950-50',
      inactive: '',
    },
    section: {
      list: 'border-b border-surface-300',
      tab: 'mr-6 border-b-3 px-1 py-3 font-bold',
      active: 'border-primary-500 text-primary-700',
      inactive: 'border-transparent text-surface-600',
    },
  } as const;
  const style = $derived(styles[variant]);

  /** Moves focus to a tab, e.g. after the owner confirms a change it deferred. */
  export function focusTab(target: T) {
    buttons[tabs.findIndex((tab) => tab.value === target)]?.focus();
  }

  async function select(next: T, focus: boolean) {
    if (next !== value) onchange(next, { focus });
    if (!focus) return;
    await tick();
    if (value === next) focusTab(next);
  }

  function onkeydown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const destination = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (destination === undefined) return;
    event.preventDefault();
    void select(tabs[destination].value, true);
  }
</script>

{#snippet content(tab: Tab<T>)}
  {#if tabContent}{@render tabContent(tab)}{:else}{tab.label}{/if}
{/snippet}

<div class="w-full {className}" data-testid={testid}>
  <div class={style.list} role="tablist" aria-label={label} data-testid="{testid}-list">
    {#each tabs as tab, index (tab.value)}
      {@const selected = tab.value === value}
      <button
        bind:this={buttons[index]}
        type="button"
        role="tab"
        id="{id}-tab-{index}"
        aria-selected={selected}
        aria-controls="{id}-panel-{index}"
        tabindex={selected ? 0 : -1}
        class="{style.tab} {selected ? style.active : style.inactive}"
        data-testid="{testid}-control"
        onclick={() => void select(tab.value, false)}
        onkeydown={(event) => onkeydown(event, index)}
      >
        {#if variant === 'page'}
          <div class="btn hover:preset-tonal-primary" data-testid="{testid}-control-label">
            <span>{@render content(tab)}</span>
          </div>
        {:else}
          {@render content(tab)}
        {/if}
      </button>
    {/each}
  </div>
  {#each tabs as tab, index (tab.value)}
    <div
      role="tabpanel"
      id="{id}-panel-{index}"
      aria-labelledby="{id}-tab-{index}"
      hidden={tab.value !== value}
      data-testid="{testid}-panel"
    >
      {@render panel(tab.value)}
    </div>
  {/each}
</div>
