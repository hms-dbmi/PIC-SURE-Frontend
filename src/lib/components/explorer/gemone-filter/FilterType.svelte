<script lang="ts">
  import { Option } from '$lib/models/GemoneFilter';

  export let selectedOption: Option = Option.Name;
</script>

<label class="flex items-center align-top space-x-2">
  <input class="radio mt-1" type="radio" bind:group={selectedOption} value={Option.Name} />
  <div>
    <p class="text-lg font-bold">Search for variants by gene name</p>
    <p class="text-sm">Ex: Rare BRCA1 variants with high consequence severity</p>
  </div>
</label>
<label class="flex items-center space-x-2">
  <input class="radio" type="radio" bind:group={selectedOption} value={Option.SNP} />
  <div>
    <p class="text-lg font-bold">Search for a specific SNP</p>
    <p class="text-sm">Ex: chr17,35269878,G,A</p>
  </div>
</label>
