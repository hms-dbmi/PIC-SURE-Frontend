<script lang="ts">
  import ApplicationStore from '$lib/stores/Application';
  const { getApplication } = ApplicationStore;

  export let data: { cell: '' };
</script>

{data.cell ? getApplication(data.cell).name : 'none'}
