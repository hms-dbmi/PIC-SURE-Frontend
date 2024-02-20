<script lang="ts">
  import CopyButton from '$lib/components/CopyButton.svelte';

  export let data = { cell: '', row: {} };
  let buttonText = 'Copy';
  const buttonClasses = ['w-24', 'bg-primary-500', 'text-on-primary-token'];
</script>

<div class="flex justify-between items-center">
  <span class="uuid">{data.cell}</span>
  <CopyButton {buttonText} itemToCopy={data.cell} classes={buttonClasses} />
</div>
