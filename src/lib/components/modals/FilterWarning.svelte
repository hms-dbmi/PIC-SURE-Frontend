<script lang="ts">
  import { goto } from '$app/navigation';
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
  class="flex gap-9 justify-center bg-surface-200 rounded-container"
>
  <aside data-testid="warning-alert" class="alert preset-tonal-warning border border-warning-500">
    <i class="fa-solid fa-triangle-exclamation text-4xl" aria-hidden="true"></i>
    <div class="alert-message">
      <h3 class="h3 text-left">
        {message}
      </h3>
      <p>Would you like to remove the invalid filters or go back to {backTo}?</p>
      <div>
        <div class="dark">
          <button class="btn preset-outlined hover:preset-filled-warning-500" onclick={reset}
            >Remove Invalid Filters</button
          >
          <button class="btn preset-outlined hover:preset-filled-warning-500" onclick={goBack}
            >Back to {backTo}</button
          >
        </div>
      </div>
    </div>
  </aside>
</section>
