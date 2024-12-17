<script lang="ts">
  import ApplicationStore from '$lib/stores/Application';
  const { getApplication } = ApplicationStore;

  interface Props {
    data: { cell: '' };
  }

  let { data }: Props = $props();
</script>

{data.cell ? getApplication(data.cell).name : 'none'}
