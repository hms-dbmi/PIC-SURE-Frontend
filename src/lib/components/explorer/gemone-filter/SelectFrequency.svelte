<script lang="ts">
  export let selectedFrequency: string[] = [];
</script>

<label>
  <input bind:group={selectedFrequency} id="Rare" type="checkbox" value="Rare" />
  Rare
</label>
<label>
  <input bind:group={selectedFrequency} id="Common" type="checkbox" value="Common" />
  Common
</label>
