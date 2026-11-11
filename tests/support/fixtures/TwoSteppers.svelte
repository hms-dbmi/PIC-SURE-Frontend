<script lang="ts">
  import Stepper from '#lib/ui/stepper/Stepper.svelte';
  import Step from '#lib/ui/stepper/Step.svelte';
</script>

{#each ['first', 'second'] as stepper (stepper)}
  <section aria-label="{stepper} stepper">
    <Stepper buttonCompleteLabel="Finish {stepper}">
      <Step name="one"><p>{stepper} step one</p></Step>
      <Step name="two"><p>{stepper} step two</p></Step>
    </Stepper>
  </section>
{/each}
