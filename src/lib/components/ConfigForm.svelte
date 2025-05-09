<script lang="ts">
  import { setContext, onMount } from 'svelte';
  
  export let onSubmit: () => void;
  export let disabled: boolean = false;
  export let id: string;
  let form: HTMLFormElement;

  function disabledAll(node: HTMLElement, shouldDisable: boolean) {
    if (shouldDisable) {
      const elements = node.querySelectorAll('input, select, textarea, button, checkbox, slide-toggle');
      elements.forEach((element) => {
        element.setAttribute('disabled', 'disabled');
      });
    } else {
      const elements = node.querySelectorAll('input, select, textarea, button, checkbox, slide-toggle');
      elements.forEach((element) => {
        element.removeAttribute('disabled');
      });
    }
  }

  onMount(() => {
    disabledAll(form, disabled);
  });
  setContext('disabledAll', disabledAll);
</script>

<form 
  id="config-form-{id}"
  data-testid="config-form-{id}"
  bind:this={form}
  on:submit|preventDefault={onSubmit} 
  use:disabledAll={disabled}
  class={$$props.class ?? ''}
  {...$$restProps}
>
  <slot />
</form>
