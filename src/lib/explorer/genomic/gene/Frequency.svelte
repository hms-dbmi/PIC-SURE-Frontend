<script lang="ts">
  import { selectedFrequency } from '#lib/query/GeneFilter.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';

  function onFrequencyChange(frequency: string) {
    log(createLog('ACTION', 'genomic.frequency_select', { frequency }));
  }
</script>

<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="genomic-frequency-rare"
    type="checkbox"
    value="Rare"
    onchange={() => onFrequencyChange('Rare')}
  />
  Rare
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="genomic-frequency-common"
    type="checkbox"
    value="Common"
    onchange={() => onFrequencyChange('Common')}
  />
  Common
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input
    bind:group={$selectedFrequency}
    id="genomic-frequency-novel"
    type="checkbox"
    value="Novel"
    onchange={() => onFrequencyChange('Novel')}
  />
  Novel
</label>
