<script lang="ts">
  import { selectedFrequency } from '$lib/stores/GeneFilter';
</script>

<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input bind:group={$selectedFrequency} id="Rare" type="checkbox" value="Rare" />
  Rare
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input bind:group={$selectedFrequency} id="Common" type="checkbox" value="Common" />
  Common
</label>
<label class="cursor-pointer block hover:preset-tonal-surface hover:rounded-md">
  <input bind:group={$selectedFrequency} id="Novel" type="checkbox" value="Novel" />
  Novel
</label>
