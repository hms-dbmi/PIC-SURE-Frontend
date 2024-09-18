<script>
  import { filters, totalParticipants } from '$lib/stores/Filter';
  import ExportStore from '$lib/stores/Export';
  let { exports } = ExportStore;

  $: participantsCount = $totalParticipants;
  $: variablesCount = $filters.length + $exports.length;
  $: dataPoints = participantsCount * variablesCount;
</script>

<div id="stats" class="w-full flex justify-evenly mb-5 pb-2">
  <div id="summary" class="w-full grid grid-flow-col auto-cols-auto ">
    <div class="text-xl">
      <label for="summary" class="mr-8 font-bold">Summary:</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="participants" class="mr-2">{participantsCount}</span>
      <label for="participants">Participants</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="variables" class="mr-2">{variablesCount}</span>
      <label for="variables">Variables</label>
    </div>
    <div class="flex justify-left text-xl font-light">
      <span id="dataPoints" class="mr-2">{dataPoints}</span>
      <label for="dataPoints">Data Points</label>
    </div>
  </div>
</div>

<style>
  #stats {
    border-bottom-color: #888888;
    border-bottom: 1px solid;
    color: #888888;
  }
</style>
