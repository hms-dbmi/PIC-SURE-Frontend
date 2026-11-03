<script lang="ts">
  interface Props {
    legend: string;
    /** `[label, value]` pairs, in display order. */
    options: [string, string][];
    /** The checked values, kept in `options` order. */
    selected: string[];
    'data-testid'?: string;
  }

  let { legend, options, selected = $bindable(), 'data-testid': testid }: Props = $props();

  function toggle(value: string, checked: boolean) {
    selected = options
      .map(([, option]) => option)
      .filter((option) => (option === value ? checked : selected.includes(option)));
  }
</script>

<fieldset data-testid={testid}>
  <legend class="required">{legend}</legend>
  {#each options as [label, value] (value)}
    <label class="flex items-center space-x-2">
      <input
        class="checkbox"
        type="checkbox"
        checked={selected.includes(value)}
        onchange={(event) => toggle(value, event.currentTarget.checked)}
      />
      <div>{label}</div>
    </label>
  {/each}
</fieldset>
