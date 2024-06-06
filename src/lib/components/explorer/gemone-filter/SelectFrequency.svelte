<script lang="ts">
  import GeneFilterStore from '$lib/stores/GenomicFilter';
  let { selectedFrequency } = GeneFilterStore;
</script>

<label>
  <input bind:group={$selectedFrequency} id="Rare" type="checkbox" value="Rare" />
  Rare
</label>
<label>
  <input bind:group={$selectedFrequency} id="Common" type="checkbox" value="Common" />
  Common
</label>
<label>
  <input bind:group={$selectedFrequency} id="Novel" type="checkbox" value="Novel" />
  Novel
</label>
