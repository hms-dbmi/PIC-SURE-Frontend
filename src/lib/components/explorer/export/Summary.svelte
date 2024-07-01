<script>

$: participantsCount = 0;
$: variablesCount = 0;
$: dataPoints = 0;

</script>

<div id="stats" class="w-2/3 flex justify-evenly mb-2">
  <div id="summary" class="w-full grid grid-cols-3">
    <div class="flex">
      <label for="summary" class="mr-8 font-bold">Summary:</label>
      <span id="participants" class="mr-2">{participantsCount}</span>
      <label for="participants">Participants</label>
    </div>
    <div class="flex justify-center">
      <span id="variables" class="mr-2">{variablesCount}</span>
      <label for="variables">Variables</label>
    </div>
    <div class="flex justify-center">
      <span id="dataPoints" class="mr-2">{dataPoints}</span>
      <label for="dataPoints">Data Points</label>
    </div>
  </div>
</div>

<style>

</style>