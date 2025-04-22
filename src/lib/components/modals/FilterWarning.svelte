<script lang="ts">
  import { goto } from '$app/navigation';
  import { getModalStore } from '@skeletonlabs/skeleton';

  const identity = () => {};
  let message = $derived($modalStore[0]?.meta.message || '');
  let backTo = $derived($modalStore[0]?.meta.backTo || '');
  let resetQuery = $derived($modalStore[0]?.meta.resetQuery || identity);

  const modalStore = getModalStore();
  function closedModal() {
    if ($modalStore[0]) {
      modalStore.close();
    }
  }
  function goBack() {
    goto(`/${backTo.toLowerCase()}`);
    closedModal();
  }

  function reset() {
    resetQuery();
    closedModal();
  }
</script>

<section
  id="discover-error-container"
  class="flex gap-9 justify-center bg-surface-200 rounded-container-token"
>
  <aside data-testid="warning-alert" class="alert variant-ghost-warning">
    <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
    <div class="alert-message">
      <h3 class="h3 text-left">
        {message}
      </h3>
      <p>Would you like to remove the invalid filters or go back to {backTo}?</p>
      <div>
        <div class="dark">
          <button class="btn variant-ringed hover:variant-filled-warning" onclick={reset}
            >Remove Invalid Filters</button
          >
          <button class="btn variant-ringed hover:variant-filled-warning" onclick={goBack}
            >Back to {backTo}</button
          >
        </div>
      </div>
    </div>
  </aside>
</section>
