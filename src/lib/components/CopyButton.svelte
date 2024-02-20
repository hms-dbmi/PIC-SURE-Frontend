<script lang="ts">
  import { clipboard } from '@skeletonlabs/skeleton';

  export let buttonText = 'Copy';
  export let itemToCopy: string;
  export let classes: string[] = ['variant-ringed-primary'];
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
  class={'btn ' + classes.join(' ')}
  on:click={updateCopyButtonText}
  use:clipboard={itemToCopy}
>
  {buttonText}
</button>
