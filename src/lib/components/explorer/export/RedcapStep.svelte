<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';
  import { getDatasetId } from '$lib/ExportStepperManager.svelte';
</script>

<section class="flex flex-col w-full h-full">
  <p>
    By clicking "Request Access" you will be taken to the externally linked Request Data and
    Biosamples RedCap form where you can submit your request for data and biosamples.
  </p>
  <p class="mb-0">Before submitting the RedCap form, make sure you have:</p>
  <ul class="list-disc list-inside ml-8">
    <li>Selected all variables you would like to include in your export</li>
    <li>
      <a href="/collaborate" class="anchor">Identified collaborators</a> if using data from other institutions.
    </li>
  </ul>
  <div class="flex flex-row items-center self-center card p-4 my-4">
    <label for="copyable-dataset-id" class="font-bold mr-2">Dataset ID:</label>
    <span id="copyable-dataset-id" class="mr-2">{getDatasetId()}</span>
    <CopyButton
      itemToCopy={getDatasetId() ?? 'MISSING_DATASET_ID'}
      class="preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500"
    />
  </div>
  <p>
    Once the request has been submitted, the local Sample and Data Access Committee will review and
    notify you of a decision via email.
  </p>
  <p>
    Once approved, access to patient-level data will be provisioned in the GIC Service Workbench. To
    learn more about this, please refer to the <a href="/analyze" class="anchor">Analyze page</a>.
  </p>
</section>
