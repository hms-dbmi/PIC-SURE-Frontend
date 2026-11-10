<script lang="ts">
  let { data = {} } = $props();
</script>

<input type="text" aria-label="panel-input-{data?.dataset_id ?? ''}" />
