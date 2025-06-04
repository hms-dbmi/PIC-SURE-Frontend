<script lang="ts">
  let { value, onChange }: { value: 'and' | 'or'; onChange: (value: 'and' | 'or') => void } =
    $props();
</script>

<select class="select" bind:value onchange={(e) => onChange(e.currentTarget.value as 'and' | 'or')}>
  <option value="and">AND</option>
  <option value="or">OR</option>
</select>
