<script lang="ts">
  import CopyButton from '$lib/components/buttons/CopyButton.svelte';

  export let data = { cell: '', row: {} };
  let buttonText = 'Copy';
  const buttonClasses = ['w-24', 'bg-primary-500', 'text-on-primary-token', 'ml-2'];
</script>

<div class="flex items-center">
  <span class="uuid">{data.cell}</span>
  <CopyButton {buttonText} itemToCopy={data.cell} class={buttonClasses} />
</div>
