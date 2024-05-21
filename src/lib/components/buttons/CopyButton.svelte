<script lang="ts">
  import { clipboard } from '@skeletonlabs/skeleton';

  export let buttonText = 'Copy';
  export let itemToCopy: string;
  let clazz = 'btn variant-ringed-primary';
  export { clazz as class };
  let timer: ReturnType<typeof setTimeout>;

  function debounce(text: string) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      buttonText = text;
    }, 4500);
  }
  function updateCopyButtonText() {
    debounce(buttonText);
    buttonText = 'Copied!';
  }
</script>

<button
  type="button"
  data-testid="copy-button"
  class={clazz}
  on:click={updateCopyButtonText}
  use:clipboard={itemToCopy}
>
  {buttonText}
</button>
