<script lang="ts">
  import { selectedFrequency } from '$lib/stores/GeneFilter';
  import { log, createLog } from '$lib/logger';

  function onFrequencyChange(frequency: string) {
    log(createLog('ACTION', 'genomic.frequency_select', { frequency }));
  }
</script>

<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="Rare"
    type="checkbox"
    value="Rare"
    onchange={() => onFrequencyChange('Rare')}
  />
  Rare
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="Common"
    type="checkbox"
    value="Common"
    onchange={() => onFrequencyChange('Common')}
  />
  Common
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="Novel"
    type="checkbox"
    value="Novel"
    onchange={() => onFrequencyChange('Novel')}
  />
  Novel
</label>
