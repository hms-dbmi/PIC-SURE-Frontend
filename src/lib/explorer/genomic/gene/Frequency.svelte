<script lang="ts">
  import { genomicDraft } from '#lib/query/genomicDraft.svelte.ts';
  import { log, createLog } from '#lib/telemetry/logger.ts';
  import { tones } from '#lib/ui/surface.ts';

  function onFrequencyChange(frequency: string) {
    log(createLog('ACTION', 'genomic.frequency_select', { frequency }));
  }
</script>

<label class="cursor-pointer block {tones['hover-tonal-surface']} hover:rounded-md">
  <input
    bind:group={genomicDraft.frequency}
    id="genomic-frequency-rare"
    type="checkbox"
    value="Rare"
    onchange={() => onFrequencyChange('Rare')}
  />
  Rare
</label>
<label class="cursor-pointer block {tones['hover-tonal-surface']} hover:rounded-md">
  <input
    bind:group={genomicDraft.frequency}
    id="genomic-frequency-common"
    type="checkbox"
    value="Common"
    onchange={() => onFrequencyChange('Common')}
  />
  Common
</label>
<label class="cursor-pointer block {tones['hover-tonal-surface']} hover:rounded-md">
  <input
    bind:group={genomicDraft.frequency}
    id="genomic-frequency-novel"
    type="checkbox"
    value="Novel"
    onchange={() => onFrequencyChange('Novel')}
  />
  Novel
</label>
