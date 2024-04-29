<script lang="ts">
  import { Step, Stepper, getModalStore } from '@skeletonlabs/skeleton';

  const modalStore = getModalStore();

  const cBase = 'card p-4 w-modal shadow-xl space-y-4';
  const cHeader = 'text-2xl font-bold';
</script>

{#if $modalStore[0]}
  <div class={cBase}>
    <header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
    <article>{$modalStore[0].body ?? '(body missing)'}</article>
    <Stepper>
      <Step>
        <svelte:fragment slot="header">(header)</svelte:fragment>
        (content)
      </Step>
      <Step>
        <svelte:fragment slot="header">(header)</svelte:fragment>
        (content)
      </Step>
      <!-- ... -->
    </Stepper>
  </div>
{/if}
