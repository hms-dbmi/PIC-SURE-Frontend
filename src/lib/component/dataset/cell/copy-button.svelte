<script lang="ts">
  import { clipboard } from '@skeletonlabs/skeleton';

  export let data = { cell: '', row: {} };

  let buttonText = 'Copy';
  let timer: ReturnType<typeof setTimeout>;

  function debounce(text: string) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      buttonText = text;
    }, 4500);
  }
  function copyToClipboard() {
    debounce(buttonText);
    buttonText = 'Copied!';
  }
</script>

<div class="flex justify-between items-center">
  <span class="uuid">{data.cell}</span>
  <button
    type="button"
    class="btn w-24 bg-primary-500 text-on-primary-token"
    on:click={copyToClipboard}
    use:clipboard={data.cell}
  >
    {buttonText}
  </button>
</div>
